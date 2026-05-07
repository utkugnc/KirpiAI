# KirpiAI
1 billion parameter Turkish Model, trained from scratch


The model is in Tosun. To run it:

1- ssh {address} -> Then enter your password 

2- Allocate a GPU node -> srun --partition=cuda --qos=cuda --gres=gpu:1 --mem=32G --time=1:00:00 --pty bash

3- Activate venv -> source venv/bin/activate

4- Go to cd ~/turkish-1b/out/turkish-1b-v100-smoke

5- Run this line: python -m uvicorn server:app --host 0.0.0.0 --port 8000

6- Then create another terminal, run this line: ssh -L 8000:cn18:8000 {address} -> enter your password

7- Run expo, then you can start chatting with our brilliant model

After you done with the cluster, do not forget to cancel it: scancel JOBID
