# Gunakan image GCC untuk build sekaligus jalan (agar GLIBC pasti cocok)
FROM gcc:latest

WORKDIR /app

# Salin source code
COPY src/Publisher.cpp .

# Kompilasi langsung di tempat
RUN g++ -O3 -o RadarPublisher Publisher.cpp

# Jalankan langsung
CMD ["./RadarPublisher"]
