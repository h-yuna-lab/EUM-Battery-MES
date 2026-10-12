# mes_equipment (L2) 크로스플랫폼 Makefile
#
# 사전 준비:
#   Mac    : brew install curl cjson pkg-config  (curl은 보통 이미 있음)
#   Windows(MSYS2 MinGW64) :
#       pacman -S mingw-w64-x86_64-gcc mingw-w64-x86_64-make \
#                 mingw-w64-x86_64-curl mingw-w64-x86_64-cjson mingw-w64-x86_64-pkg-config
#   Linux  : sudo apt install libcurl4-openssl-dev libcjson-dev pkg-config
#
# 사용법:
#   Mac/Linux : make
#   Windows(MinGW) : mingw32-make

CC = gcc
PKGS = libcurl libcjson
CFLAGS = -Wall -Wextra -std=c11 $(shell pkg-config --cflags $(PKGS))
SRCS = main.c net.c protocol.c api_client.c collector.c
TARGET = mes_equipment

ifeq ($(OS),Windows_NT)
    LDFLAGS = -lws2_32 -lpthread $(shell pkg-config --libs $(PKGS))
    TARGET := $(TARGET).exe
else
    LDFLAGS = -lpthread $(shell pkg-config --libs $(PKGS))
endif

all: $(TARGET)

$(TARGET): $(SRCS) net.h protocol.h api_client.h collector.h config.h
	$(CC) $(CFLAGS) -o $(TARGET) $(SRCS) $(LDFLAGS)

clean:
	rm -f $(TARGET) mes_equipment.exe
