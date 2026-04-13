# Gunakan image GCC untuk build sekaligus jalan 
FROM gcc:latest

WORKDIR /app

# Salin source code
COPY src/Publisher.cpp .

# Kompilasi
RUN g++ -O3 -o RadarPublisher Publisher.cpp

# Jalankan langsung
CMD ["./RadarPublisher"]
