# Basis image Node modern yang ringan
FROM node:20-alpine

# PINDAH KE RUMAH BARU (/app_build)
# Ini adalah trik untuk menghindari bug cache "cannot replace directory with file"
WORKDIR /app_build

# Pastikan folder bersih
RUN rm -rf ./*

# Menyalin file daftar depedensi saja dulu
COPY package.json ./

# Instal depedensi menggunakan NPM
RUN npm install

# Salin seluruh kode sisa proyek ke kontainer
COPY . .

# Ekspos port default (3000)
EXPOSE 3000

# Jalankan server development Rspack
CMD ["npm", "run", "dev"]
