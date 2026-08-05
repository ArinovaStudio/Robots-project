// robots-project-prod
//
// Node2 app-tier migration, Wave 1 (pilot), Task 1: real Kaniko image build +
// push to the in-cluster registry, then a GitOps bump. This REPLACES the old
// Jenkinsfile that used to live at this path, which was an SSH-based
// git-clone-and-`docker compose build`-directly-on-Node2 pipeline (node2Host
// 164.52.203.100, sshCredId node2-ssh-key) -- that pattern predates the k3s
// migration and was never actually registered as a live Jenkins job in the
// current k3s Jenkins (confirmed absent from `kubectl exec -n jenkins
// jenkins-0 -- ls /var/jenkins_home/jobs/`, which lists all 29 real jobs), so
// there is nothing depending on it. It is not adapted here -- this is a
// from-scratch Kaniko/GitOps pipeline, same shape as this project's other
// already-migrated app tiers.
//
// Pattern proven live by exam-backend-prod (build #2, SUCCESS,
// `kubectl exec -n jenkins jenkins-0 -- cat
// /var/jenkins_home/jobs/exam-backend-prod/builds/2/log`) and nexus-forms-prod
// (github.com/azyntor-labs/nexus-forms Jenkinsfile) -- NOTE: the
// ExaminationSystem repo's `main` branch Jenkinsfile as of an earlier commit
// (972feba) used `docker build`/`docker login`/`docker push` via bare `sh` on
// the `kaniko-agent` label; that pod only ever had the kaniko:debug executor +
// jnlp (no Docker daemon, no docker binary) so it could never have worked.
// It was fixed in commit 499a295 ("fix(jenkins): convert exam-backend-prod to
// real Kaniko build/push") to the inline-podTemplate + `/kaniko/executor`
// shape this file follows. Anyone re-deriving "the exam-backend-prod pattern"
// from the repo's Jenkinsfile alone should pull the *current* one, not assume
// the file matches what actually runs -- confirmed by reading the real build
// log, not just the repo file.
//
// This job gets its own inline pod spec (not the shared `kaniko-agent` JCasC
// podTemplate in jenkins/install/values-prod.yaml): that shared template's
// mounted `kaniko-registry-creds` secret only has an auth entry for the old
// Tailscale registry hostname (e2e-68-153.tail18b1d9.ts.net:5000), not
// registry.registry.svc.cluster.local:5000 -- same reason exam-backend-prod/
// nexus-forms-prod/nexus-meet-prod all build their own
// /kaniko/.docker/config.json at runtime from the `registry-creds` Jenkins
// credential instead. Registry is plain HTTP with htpasswd auth (no TLS), so
// the push needs --insecure.
//
// Kaniko container resources: bumped from the 500m/512Mi every Go-based
// kaniko job in this fleet uses (exam-backend-prod/nexus-forms-prod/
// terraguest-backend-prod) to 1000m/2Gi -- this Dockerfile's builder stage
// runs `npm ci`, `npx prisma generate`, and `npx next build` (a Next.js
// production build), which is materially heavier than compiling a single Go
// binary. azyntor-k3s-02 has ample headroom for this (`kubectl top nodes`:
// 32% memory used, node total resource requests at 65%/195%(limits) before
// this job existed -- confirmed live before picking this size).
podTemplate(
    yaml: '''
        apiVersion: v1
        kind: Pod
        spec:
          nodeSelector:
            kubernetes.io/hostname: azyntor-k3s-02
          tolerations:
            - key: tier
              operator: Equal
              value: data
              effect: NoSchedule
          containers:
            - name: kaniko
              image: gcr.io/kaniko-project/executor:debug
              command:
                - sleep
              args:
                - 99d
              resources:
                requests:
                  cpu: 1000m
                  memory: 2Gi
            - name: jnlp
              image: jenkins/inbound-agent:latest
    '''
) {
    node(POD_LABEL) {
        def gitCredId = 'github-pat'
        def registryCredId = 'registry-creds'
        def registry = 'registry.registry.svc.cluster.local:5000'
        def gitSha = ''

        try {
            stage('Checkout') {
                echo 'Checking out code from GitHub...'
                // Real source repo lives outside the azyntor-labs org (ArinovaStudio),
                // branch Mohsin_production (not main) -- confirmed via a fresh clone,
                // main has neither a Dockerfile nor a Jenkinsfile, both only exist on
                // Mohsin_production. The `github-pat` credential's confirmed org access
                // already covers this repo (reused here, no new credential provisioned).
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: '*/Mohsin_production']],
                    userRemoteConfigs: [[
                        url: 'https://github.com/ArinovaStudio/Robots-project.git',
                        credentialsId: gitCredId
                    ]]
                ])
                gitSha = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                echo "Building image tag: ${gitSha}"
            }

            stage('Build & Push Image') {
                // Dockerfile is already a proven-as-is multi-stage build (node:20-alpine
                // builder: npm ci --legacy-peer-deps, npx prisma generate, npx next build,
                // npx tsc --project tsconfig.server.json --outDir server-dist; runner stage
                // copies .next/public/server-dist/prisma, EXPOSE 3002,
                // CMD ["node", "server-dist/server.js"]) -- verified by reading it, not
                // rewritten. No build-time secrets are needed (confirmed: no private
                // dependencies, no ARG/ENV referencing credentials anywhere in it), so the
                // discarded-ARG-stage workaround this project uses elsewhere for Kaniko's
                // lack of BuildKit --secret support does not apply here.
                echo 'Building and pushing container image with Kaniko...'
                container('kaniko') {
                    withCredentials([usernamePassword(
                        credentialsId: registryCredId,
                        usernameVariable: 'REGISTRY_USER',
                        passwordVariable: 'REGISTRY_PASS'
                    )]) {
                        sh """
                            # Mandatory per this project's own documented Kaniko/VCS-stamping
                            # gotcha (Phase 3 finding, first hit on nexus-forms-prod): strip
                            # .git from the build context before the executor runs. This repo's
                            # own .dockerignore already lists `.git`, so Kaniko's dockerignore
                            # handling would likely exclude it anyway -- this explicit removal
                            # is kept as the mandatory, non-optional step regardless, matching
                            # every other kaniko-pattern job in this fleet (belt-and-suspenders,
                            # not reliant on .dockerignore parsing alone).
                            rm -rf "\${WORKSPACE}/.git"
                            AUTH=\$(printf '%s:%s' "\$REGISTRY_USER" "\$REGISTRY_PASS" | base64 | tr -d '\\n')
                            mkdir -p /kaniko/.docker
                            printf '{"auths":{"%s":{"auth":"%s"}}}' "${registry}" "\$AUTH" > /kaniko/.docker/config.json
                            /kaniko/executor \\
                                --context "\${WORKSPACE}" \\
                                --dockerfile Dockerfile \\
                                --destination ${registry}/robots-project:${gitSha} \\
                                --destination ${registry}/robots-project:latest \\
                                --insecure
                        """
                    }
                }
            }

            stage('Update GitOps repo') {
                echo 'Committing new image tag to azyntor-k8s...'
                withCredentials([usernamePassword(
                    credentialsId: gitCredId,
                    usernameVariable: 'GIT_USERNAME',
                    passwordVariable: 'GIT_PASSWORD'
                )]) {
                    sh """
                        rm -rf azyntor-k8s
                        git clone https://\${GIT_USERNAME}:\${GIT_PASSWORD}@github.com/azyntor-labs/azyntor-k8s.git
                        cd azyntor-k8s
                        sed -i 's/^  tag: .*/  tag: ${gitSha}/' charts/robots-project/values-prod.yaml
                        git config user.email "jenkins@azyntorlabs.com"
                        git config user.name "Jenkins (robots-project-prod)"
                        git add charts/robots-project/values-prod.yaml
                        git commit -m "deploy(robots-project): bump image tag to ${gitSha}"
                        git push origin main
                    """
                }
            }

            stage('Health Check') {
                // Deviation from exam-backend-prod/nexus-forms-prod's Health Check stage,
                // documented here rather than silently copied: those jobs curl/ssh into a
                // *live, already-deployed* production service, because those app tiers
                // were already running before their pipeline was converted to Kaniko.
                // robots-project has no k8s Deployment/Service/Ingress yet -- this
                // migration's Tasks 2-6 (not this task) write the chart's Deployment, wire
                // secrets, deploy it, and cut DNS over. There is no URL to curl yet, and
                // faking a pass against a URL that doesn't exist would be dishonest. What
                // this task actually produced -- and can honestly verify here -- is a real
                // image sitting in the registry, so this stage confirms the manifest this
                // build just pushed is retrievable from the registry's own v2 API (a real
                // server-side check, not just trusting the kaniko executor's exit code).
                // Once Tasks 2-6 land and robots-project has a real running Service, a
                // follow-up should replace this with the same live-app health check
                // exam-backend-prod/nexus-forms-prod use.
                withCredentials([usernamePassword(
                    credentialsId: registryCredId,
                    usernameVariable: 'REGISTRY_USER',
                    passwordVariable: 'REGISTRY_PASS'
                )]) {
                    sh """
                        # Two real bugs found and fixed live against build #1 (confirmed via the
                        # registry's own access log, not guessed): (1) Jenkins' default `sh` step
                        # runs dash, not bash -- \\`for i in {1..10}\\` brace expansion silently
                        # does NOT happen under dash, so the loop only ever ran once. Replaced with
                        # a portable seq-based loop. (2) A bare curl GET with no Accept header hit
                        # the registry's own real response: 404 "OCI manifest found, but accept
                        # header does not support OCI manifests" -- Kaniko pushes OCI-format
                        # manifests (\\`Content-Type: application/vnd.oci.image.manifest.v1+json\\`
                        # in the registry's own PUT log for this exact push), so the check has to
                        # ask for that format explicitly instead of relying on curl's default
                        # Accept: */*.
                        for i in \$(seq 1 10); do
                            if curl -sf -u "\$REGISTRY_USER:\$REGISTRY_PASS" \\
                                -H "Accept: application/vnd.oci.image.manifest.v1+json, application/vnd.docker.distribution.manifest.v2+json" \\
                                -o /dev/null \\
                                http://${registry}/v2/robots-project/manifests/${gitSha}; then
                                echo "Registry manifest check passed for tag ${gitSha}"
                                exit 0
                            fi
                            echo "Waiting for registry to serve the manifest... (\$i/10)"
                            sleep 2
                        done
                        echo "Registry manifest check failed after ~20 seconds"
                        exit 1
                    """
                }
            }

            echo 'robots-project image build successful!'

        } catch (Exception e) {
            echo "Pipeline failed: ${e.message}"
            throw e
        } finally {
            deleteDir()
        }
    }
}
