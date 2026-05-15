@echo off
@REM echo Dang tao moi truong conda 'fall'...
@REM conda create -n fall python=3.10 -y

@REM echo Kich hoat moi truong 'fall'...
@REM call conda activate fall

echo Cai dat PyTorch voi CUDA 12.1 (phu hop voi GTX 1650)...
conda install pytorch torchvision torchaudio pytorch-cuda=12.1 -c pytorch -c nvidia -y

echo Cai dat Ultralytics (YOLOv8), OpenCV va Requests...
pip install ultralytics opencv-python numpy requests

echo.
echo ========================================
echo HOAN THANH CAI DAT!
echo ========================================
echo De chay chuong trinh, ban lam theo cac buoc sau:
echo 1. Kich hoat moi truong: conda activate fall_env
echo 2. Chay chuong trinh:    python main.py
echo.
pause
