@echo off
title MQTT Mosquitto Broker (Port 18883)
color 0A
echo =======================================================================
echo          KHOI DONG MQTT MOSQUITTO BROKER (CONG 18883)
echo =======================================================================
echo  - Broker dang chay tai: localhost:18883
echo  - File cau hinh: C:\Program Files\mosquitto\mosquitto.conf
echo  - Nhan Ctrl + C neu muon dung Broker.
echo =======================================================================
echo.

"C:\Program Files\mosquitto\mosquitto.exe" -c "C:\Program Files\mosquitto\mosquitto.conf" -v

pause

