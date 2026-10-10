# StudentHub — MERN Application on Kubernetes

A MERN stack Student Management application deployed on AWS Kubernetes using kOps, Docker, and MongoDB.

This project demonstrates how to containerize a React frontend and Node.js backend, deploy them on Kubernetes, and configure MongoDB as a StatefulSet with persistent storage and a three-member Replica Set.

The next phase of the project is to automate application builds and deployments using Jenkins CI/CD.

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Application Features](#application-features)
- [Repository Structure](#repository-structure)
- [Application Architecture](#application-architecture)
- [Docker Images](#docker-images)
- [AWS and Kubernetes Environment](#aws-and-kubernetes-environment)
- [Deployment Guide](#deployment-guide)
- [Verification and Troubleshooting](#verification-and-troubleshooting)
- [Jenkins CI/CD Roadmap](#jenkins-cicd-roadmap)
- [Security Considerations](#security-considerations)
- [Future Improvements](#future-improvements)
- [Author](#author)

## Project Overview

StudentHub is a student management application built using the MERN stack.

The application allows users to create, view, update, and delete student records. The frontend is served by Nginx, which forwards API requests to the Node.js backend through an internal Kubernetes Service.

MongoDB is deployed using a StatefulSet with three members configured as a Replica Set. Each MongoDB Pod uses persistent storage provisioned through AWS EBS.

The project currently focuses on manually deploying and verifying the application on Kubernetes. Jenkins-based CI/CD automation is the next development phase.

## Architecture

```text
                         Internet
                            |
                            v
                  AWS LoadBalancer
                            |
                            v
                    react-service
                            |
                 +----------+----------+
                 |                     |
                 v                     v
             React Pod 1           React Pod 2
                 |                     |
                 +----------+----------+
                            |
                         Nginx
                            |
                       /api/*
                            |
                            v
                      node-service
                            |
                 +----------+----------+
                 |                     |
                 v                     v
             Node Pod 1            Node Pod 2
                 |                     |
                 +----------+----------+
                            |
                            v
                    MongoDB Replica Set
                            |
             +--------------+--------------+
             |              |              |
             v              v              v
         mongodb-0      mongodb-1      mongodb-2
         MongoDB Pod    MongoDB Pod    MongoDB Pod
             |              |              |
             v              v              v
           AWS EBS         AWS EBS         AWS EBS
```

The MongoDB Replica Set elects a primary member, with the other eligible members acting as secondaries. The primary's role can change during an election.

## Technology Stack

### Application
- React
- Vite
- Node.js
- Express.js
- MongoDB
- Mongoose
- Axios

### Containerization
- Docker
- Docker Hub
- Multi-stage Docker builds

### Cloud and Kubernetes
- Amazon Web Services (AWS)
- Amazon EC2
- kOps
- Kubernetes
- Kubernetes Deployments and StatefulSets
- Kubernetes Services
- ConfigMaps
- PersistentVolumes and PersistentVolumeClaims
- AWS EBS CSI driver

### Web Server
- Nginx

### Planned CI/CD
- GitHub
- Jenkins
- Docker image build and push
- Kubernetes deployment automation

## Application Features

Student records contain the following fields:

- Name
- Course
- Age

The backend provides these API endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/students` | Retrieve all students |
| GET | `/api/students/:id` | Retrieve a student by ID |
| POST | `/api/students` | Create a student |
| PUT | `/api/students/:id` | Update a student |
| DELETE | `/api/students/:id` | Delete a student |
| GET | `/health` | Health endpoint |

Example student:

```json
{
  "name": "Rahul Sharma",
  "course": "Computer Science",
  "age": 21
}
```

## Repository Structure

```text
studenthub-kubernetes-cicd/
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
│
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       └── App.jsx
│
├── yamls/
│   ├── sts.yml
│   ├── sts-svc.yml
│   ├── node-config.yaml
│   ├── node-deployment.yml
│   ├── node-service.yaml
│   ├── react-deployment.yaml
│   └── react-service.yaml
│
├── Jenkinsfile
└── README.md
```

The repository structure may change as CI/CD and additional Kubernetes configurations are implemented.

## Application Architecture

### Frontend

The frontend uses React and Vite. It is built into static production files and served by Nginx.

The frontend makes API requests using relative paths, such as:

```javascript
axios.get("/api/students");
```

This allows the browser to use the same public origin for the frontend and API.

### Nginx Reverse Proxy

The frontend's Nginx configuration forwards API requests to the backend Service:

```nginx
location /api/ {
    proxy_pass http://node-service:5000;
}
```

The `node-service` hostname is resolved through Kubernetes DNS from within the cluster.

### Backend

The backend uses Node.js, Express.js, and Mongoose. It listens on port `5000` and connects to MongoDB using the `MONGO_URI` environment variable.

### MongoDB

MongoDB runs as a three-replica StatefulSet named `mongodb`, with a Replica Set named `rs0`.

The application uses the `school` database and the `students` collection.

The configured connection string is:

```text
mongodb://mongodb-0.mongodb:27017,mongodb-1.mongodb:27017,mongodb-2.mongodb:27017/school?replicaSet=rs0
```

This configuration uses stable StatefulSet DNS names and a headless Service named `mongodb`.

### Persistent Storage

Each MongoDB Pod receives its own PersistentVolumeClaim through the StatefulSet's `volumeClaimTemplates`.

The current manifests request 2 GiB per claim and use the `kops-csi-1-21` StorageClass.

The underlying storage is provisioned using AWS EBS through the EBS CSI driver.

## Docker Images

The application images are published to Docker Hub.

| Component | Image |
|---|---|
| Backend | `abhisalunke16/studenthub-backend:v2` |
| Frontend | `abhisalunke16/studenthub-frontend:v1` |

These tags represent the versions currently used in the project deployment. Update this section whenever the deployed versions change.

### Build the backend image

From the repository root:

```bash
docker build --no-cache \
  -t abhisalunke16/studenthub-backend:v2 ./backend
```

### Build the frontend image

```bash
docker build \
  -t abhisalunke16/studenthub-frontend:v1 ./frontend
```

### Push the images

Authenticate to Docker Hub first:

```bash
docker login
```

Then push the images:

```bash
docker push abhisalunke16/studenthub-backend:v2
docker push abhisalunke16/studenthub-frontend:v1
```

Do not reuse an existing tag for different image contents in the normal release workflow. Prefer a new version tag or immutable commit-based tag for each release.

## AWS and Kubernetes Environment

The Kubernetes cluster is managed by kOps on AWS in the `ap-south-1` region.

The current application resources include:

| Resource | Configuration |
|---|---|
| Backend Deployment | `node-deploy`, 2 replicas |
| Backend Service | `node-service`, ClusterIP, port 5000 |
| Frontend Deployment | `react-deploy`, 2 replicas |
| Frontend Service | `react-service`, LoadBalancer, port 80 |
| MongoDB StatefulSet | `mongodb`, 3 replicas |
| MongoDB Service | `mongodb`, headless Service |
| Backend ConfigMap | `node-config` |
| MongoDB storage | EBS-backed PVCs |

These settings describe the current project configuration. They do not by themselves guarantee production-level availability or security.

## Deployment Guide

### Prerequisites

Before deploying, ensure you have:

- An operational AWS account and kOps-managed Kubernetes cluster
- `kubectl` configured for the target cluster
- Docker installed for building images
- Access to the Docker Hub image repositories
- The required AWS EBS CSI components and StorageClass
- The repository cloned locally

Clone the repository:

```bash
git clone https://github.com/abhisalunke-in/studenthub-kubernetes-cicd.git
cd studenthub-kubernetes-cicd
```

Replace the GitHub URL if your repository uses a different owner or name.

Confirm cluster access:

```bash
kubectl get nodes
kubectl get storageclass
```

### Step 1: Deploy the MongoDB headless Service

Apply the Service before the StatefulSet:

```bash
kubectl apply -f yamls/sts-svc.yml
kubectl get svc mongodb
```

The Service should have `CLUSTER-IP` set to `None`.

### Step 2: Deploy the MongoDB StatefulSet

```bash
kubectl apply -f yamls/sts.yml
kubectl rollout status statefulset/mongodb
```

Check Pods and storage:

```bash
kubectl get pods -l app=mongodb -o wide
kubectl get pvc
kubectl get pv
```

Wait until all MongoDB Pods are ready and their PVCs are bound.

### Step 3: Initialize the MongoDB Replica Set

If the Replica Set has not already been initialized, connect to a MongoDB Pod:

```bash
kubectl exec -it mongodb-0 -- mongosh
```

Run this initialization once:

```javascript
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongodb-0.mongodb:27017" },
    { _id: 1, host: "mongodb-1.mongodb:27017" },
    { _id: 2, host: "mongodb-2.mongodb:27017" }
  ]
});
```

Check its status:

```javascript
rs.status();
```

Do not run `rs.initiate()` again if the Replica Set is already initialized. Check its existing status instead.

Exit the Mongo shell when finished.

### Step 4: Configure and deploy the backend

Apply the backend ConfigMap:

```bash
kubectl apply -f yamls/node-config.yaml
```

Verify that the backend Deployment references the intended image tag. Then apply the Deployment and Service:

```bash
kubectl apply -f yamls/node-deployment.yml
kubectl apply -f yamls/node-service.yaml
kubectl rollout status deployment/node-deploy
```

Verify:

```bash
kubectl get pods -l app=node
kubectl get svc node-service
kubectl logs deployment/node-deploy
```

The backend logs should indicate that MongoDB connected successfully and the server started on port 5000.

### Step 5: Deploy the frontend

Ensure the frontend Deployment references the intended Docker Hub image:

```text
abhisalunke16/studenthub-frontend:v1
```

Apply the Deployment and Service:

```bash
kubectl apply -f yamls/react-deployment.yaml
kubectl apply -f yamls/react-service.yaml
kubectl rollout status deployment/react-deploy
```

Check the resources:

```bash
kubectl get pods -l app=react
kubectl get svc react-service
```

Wait for the LoadBalancer Service to receive an external hostname:

```bash
kubectl get svc react-service -w
```

Open the hostname in a browser using HTTP. HTTPS should not be assumed until TLS has been configured.

### Step 6: Test the application

Verify the backend API from the cluster environment or through a temporary port-forward:

```bash
kubectl port-forward service/node-service 5000:5000
```

In another terminal:

```bash
curl -i http://localhost:5000/api/students
```

Test creating a student:

```bash
curl -i -X POST http://localhost:5000/api/students \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Student","course":"DevOps","age":19}'
```

Remove the test record through the application if it is no longer required.

Finally, test the application through its public LoadBalancer URL and verify that create, read, update, and delete operations work.

## Verification and Troubleshooting

Check the overall resources:

```bash
kubectl get nodes
kubectl get pods -o wide
kubectl get deployments
kubectl get statefulset
kubectl get svc
kubectl get pvc
kubectl get pv
```

Check backend logs:

```bash
kubectl logs deployment/node-deploy
```

Check frontend logs:

```bash
kubectl logs deployment/react-deploy
```

Inspect the backend Deployment and image:

```bash
kubectl describe deployment node-deploy

kubectl get deployment node-deploy \
  -o jsonpath='{.spec.template.spec.containers[0].image}{"\n"}'
```

Inspect Service endpoints:

```bash
kubectl get endpoints node-service
kubectl get endpoints react-service
```

For new Kubernetes versions, EndpointSlices can also be inspected:

```bash
kubectl get endpointslices
```

If an API operation fails, inspect the browser's Network tab, verify the exact request URL and HTTP method, and compare the deployed container's code with the local source code.

## Jenkins CI/CD Roadmap

The next phase is to implement Jenkins-based automation.

The intended pipeline will gradually cover:

1. Checkout source code from GitHub.
2. Run application checks and tests.
3. Perform code-quality analysis using SonarQube.
4. Build frontend and backend Docker images.
5. Push versioned images to Docker Hub.
6. Update Kubernetes Deployments.
7. Verify rollout status and application health.

The Jenkins pipeline is not considered complete until these stages have been implemented and tested successfully.

The exact trigger, credentials handling, image-tagging strategy, and deployment permissions will be documented after the pipeline is configured.

## Security Considerations

This project is a learning environment and should not be treated as production-hardened by default.

Before using it for production:

- Store credentials in appropriate secret-management systems.
- Do not commit `.env` files, private keys, cloud credentials, or registry passwords.
- Use Kubernetes Secrets for sensitive application configuration.
- Restrict network access and Kubernetes permissions.
- Configure MongoDB authentication and appropriate network policies.
- Add readiness and liveness probes and resource requests and limits.
- Implement backups and test restoration.
- Configure HTTPS and appropriate ingress or load-balancing controls.
- Monitor logs, metrics, storage usage, and security updates.

A three-member MongoDB Replica Set does not replace backups. Pod replication on one worker also does not provide worker-node failure tolerance.

## Future Improvements

- Jenkins CI/CD pipeline
- SonarQube integration
- Kubernetes Secrets and least-privilege access
- Readiness and liveness probes
- Resource requests and limits
- Horizontal Pod Autoscaler
- NetworkPolicies and PodDisruptionBudgets
- MongoDB backup and restore procedures
- Worker-node distribution and availability improvements
- HTTPS and Ingress
- Monitoring and centralized logging
- Helm packaging

## Author

**Abhijeet Salunke**

GitHub: [abhijeet-salunke-in](https://github.com/abhijeet-salunke-in)

LinkedIn: [Abhijeet Salunke](https://www.linkedin.com/in/abhijeet-salunke-in/)

This project is part of my hands-on learning journey in DevOps, containerization, AWS, and Kubernetes.
