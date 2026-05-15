#!/bin/bash
echo "Đang tạo môi trường conda 'fall_env'..."
conda create -n fall_env python=3.10 -y

# Khởi tạo conda cho bash session này
eval "$(conda shell.bash hook)"
conda activate fall_env

echo "Cài đặt PyTorch với CUDA 11.8..."
conda install pytorch torchvision torchaudio pytorch-cuda=11.8 -c pytorch -c nvidia -y

echo "Cài đặt Ultralytics (YOLOv8) và OpenCV..."
pip install ultralytics opencv-python numpy

echo ""
echo "========================================"
echo "HOÀN THÀNH CÀI ĐẶT!"
echo "========================================"
echo "Để chạy chương trình, gõ:"
echo "conda activate fall_env"
echo "python main.py"
