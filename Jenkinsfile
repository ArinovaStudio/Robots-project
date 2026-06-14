// =============================================================================
// Robots Project — Jenkins CI/CD Pipeline
// Deploys to Node 2 (164.52.203.100) via SSH
// Repo cloned on Node 2 at: /opt/cybershield/apps/robots-project/
// Compose file: /opt/cybershield/docker-compose.yml
// =============================================================================

node {

    def gitRepoUrl   = 'https://github.com/ArinovaStudio/Robots-project.git'
    def gitBranch    = '*/Mohsin_production'
    def gitCredId    = 'github-pat'

    def node2Host    = '164.52.203.100'
    def sshCredId    = 'node2-ssh-key'                   // Jenkins SSH key credential

    def appDir       = '/opt/cybershield/apps/robots-project'
    def composeDir   = '/opt/cybershield'
    def serviceName  = 'robots-project'
    def healthUrl    = 'http://localhost:3002/'

    try {

        stage('Checkout') {
            echo 'Checking out code...'
            checkout([
                $class: 'GitSCM',
                branches: [[name: gitBranch]],
                userRemoteConfigs: [[
                    url: gitRepoUrl,
                    credentialsId: gitCredId
                ]]
            ])
            sh 'git rev-parse HEAD'
        }

        stage('Deploy to Node 2') {
            echo 'Deploying to Node 2...'

            sshagent(credentials: [sshCredId]) {
                sh """
                    ssh -o StrictHostKeyChecking=no root@${node2Host} '

                        echo "==> Pulling latest code..."
                        if [ -d "${appDir}/.git" ]; then
                            cd ${appDir}
                            git fetch origin
                            git checkout Mohsin_production
                            git pull origin Mohsin_production
                        else
                            mkdir -p ${appDir}
                            git clone -b Mohsin_production https://github.com/ArinovaStudio/Robots-project.git ${appDir}
                        fi

                        echo "==> Building Docker image..."
                        cd ${composeDir}
                        docker compose build ${serviceName}

                        echo "==> Restarting container..."
                        docker compose up -d ${serviceName}

                        echo "==> Waiting for container to be healthy..."
                        sleep 15

                        for i in \$(seq 1 15); do
                            if wget -qO- ${healthUrl} > /dev/null 2>&1; then
                                echo "Health check passed!"
                                exit 0
                            fi
                            echo "Waiting... (\$i/15)"
                            sleep 4
                        done

                        echo "Health check failed after 1 minute"
                        exit 1
                    '
                """
            }
        }

        stage('Verify') {
            echo 'Verifying container status...'
            sshagent(credentials: [sshCredId]) {
                sh """
                    ssh -o StrictHostKeyChecking=no root@${node2Host} '
                        docker ps --filter name=${serviceName} --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"
                        docker logs ${serviceName} --tail 20
                    '
                """
            }
        }

        echo '✅ Robots Project deployed successfully!'

    } catch (Exception e) {
        echo "❌ Deployment failed: ${e.message}"

        sshagent(credentials: [sshCredId]) {
            sh """
                ssh -o StrictHostKeyChecking=no root@${node2Host} '
                    docker logs ${serviceName} --tail 50 || true
                ' || true
            """
        }

        throw e

    } finally {
        deleteDir()
    }
}
