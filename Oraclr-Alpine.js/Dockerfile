FROM node:16.20-buster

#INSTALL LIBAIO1 & UNZIP (NEEDED FOR STRONG-ORACLE)
RUN apt-get update \
 && apt-get install -y libaio1 \
 && apt-get install -y build-essential \
 && apt-get install -y unzip \
 && apt-get install -y curl

#ADD ORACLE INSTANT CLIENT
RUN mkdir -p /opt/oracle
WORKDIR /opt/oracle

COPY ./instantclient .

# ADD ./oracle/linux/ .

RUN unzip instantclient-basic-linuxx64.zip 

ENV LD_LIBRARY_PATH="/opt/oracle/instantclient_21_10"
ENV OCI_HOME="/opt/oracle/instantclient_21_10"
ENV OCI_LIB_DIR="/opt/oracle/instantclient_21_10"
# ENV OCI_INCLUDE_DIR="/opt/oracle/instantclient/sdk/include"
# ENV OCI_VERSION=12

# RUN echo '/opt/oracle/instantclient/' | tee -a /etc/ld.so.conf.d/oracle_instant_client.conf && ldconfig
RUN echo '/opt/oracle/instantclient_21_10' |  tee -a /etc/ld.so.conf.d/oracle-instantclient.conf && ldconfig

# wget https://download.oracle.com/otn_software/linux/instantclient/instantclient-basic-linuxx64.zip
# sudo mkdir -p /opt/oracle
# sudo apt-get install -y libaio1
# cd /opt/oracle/
# sudo unzip instantclient-basic-linuxx64.zip
# ls /opt/oracle/instantclient_21_10
# sudo sh -c "echo /opt/oracle/instantclient_21_10 > /etc/ld.so.conf.d/oracle-instantclient.conf"
# sudo ldconfig
# export LD_LIBRARY_PATH=/opt/oracle/instantclient_21_10:$LD_LIBRARY_PATH
