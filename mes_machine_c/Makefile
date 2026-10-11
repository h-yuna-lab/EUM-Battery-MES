# mes_machine (L1) 크로스플랫폼 Makefile
# 사용법:
#   Mac/Linux : make
#   Windows(MinGW, MSYS2 등) : mingw32-make  또는  make (make가 설치되어 있다면)

CC = gcc
CFLAGS = -Wall -Wextra -std=c11
SRCS = main.c net.c protocol.c queue.c
TARGET = mes_machine

ifeq ($(OS),Windows_NT)
    LDFLAGS = -lws2_32 -lpthread
    TARGET := $(TARGET).exe
else
    LDFLAGS = -lpthread
endif

all: $(TARGET)

$(TARGET): $(SRCS) net.h protocol.h queue.h
	$(CC) $(CFLAGS) -o $(TARGET) $(SRCS) $(LDFLAGS)

clean:
	rm -f $(TARGET) mes_machine.exe
