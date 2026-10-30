
# Multi Service Application

Project: https://roadmap.sh/projects/multiservice-docker

# Setup Steps

- Create AWS EC2 instance and login to the instance using ssh. If you do not know how to create and connect to EC2 instance, you can check out my [Youtube Playlist on AWS](https://www.youtube.com/playlist?list=PLP-z5YySqpBA)
- Then run the below commands one-by-one:
```
git clone https://gitlab.com/connect2sazad/blue-green-deployment
python3 gen_env.py
docker compose up -d
```
- This will generate the containers and images and wallah, you can see the application using your EC2 instance's Public IP or Public DNS


- Only if you want to remove all the docker resources created by this repository:
```
sudo chmod +x dc.sh
./dc.sh
```