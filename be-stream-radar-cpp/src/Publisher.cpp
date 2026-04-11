#include <iostream>
#include <string>
#include <vector>
#include <chrono>
#include <thread>
#include <cmath>
#include <cstring>
#include <fcntl.h>
#include <sys/socket.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <netdb.h>

#pragma pack(push, 1)
struct TrackData {
    int32_t trackId;
    double lat;
    double lon;
    float altitude; 
    float speed;
    float heading;
    int64_t timestamp;
    uint8_t classification; 
};
#pragma pack(pop)

int sock = -1;
int currentTargetCount = 100;
auto startTime = std::chrono::steady_clock::now();

double get_random(int index, double seed) {
    return fmod(std::abs(sin(index * 12.9898 + seed * 78.233)) * 43758.5453, 1.0);
}

bool send_all(int s, const char* buf, int len) {
    int total = 0;
    int bytesleft = len;
    int n;
    while(total < len) {
        n = send(s, buf + total, bytesleft, 0);
        if (n <= 0) break;
        total += n;
        bytesleft -= n;
    }
    return total == len;
}

void handle_commands() {
    if (sock == -1) return;
    char buffer[1024] = {0};
    int valread = recv(sock, buffer, 1024, MSG_DONTWAIT);
    if (valread > 0) {
        std::string cmd(buffer);
        size_t pos = cmd.find("\"value\":");
        if (pos != std::string::npos) {
            try {
                std::string valStr = cmd.substr(pos + 8);
                currentTargetCount = std::stoi(valStr);
            } catch (...) {}
        }
    }
}

void connect_to_gateway() {
    struct addrinfo hints, *res;
    memset(&hints, 0, sizeof(hints));
    hints.ai_family = AF_INET;
    hints.ai_socktype = SOCK_STREAM;
    if (getaddrinfo("radar-gateway", "9090", &hints, &res) != 0) return;
    sock = socket(res->ai_family, res->ai_socktype, res->ai_protocol);
    if (sock < 0) { freeaddrinfo(res); return; }
    if (connect(sock, res->ai_addr, res->ai_addrlen) < 0) {
        close(sock); sock = -1; freeaddrinfo(res); return;
    }
    freeaddrinfo(res);
    fcntl(sock, F_SETFL, O_NONBLOCK);
}

int main() {
    std::cout << "📡 [Backend] Radar engine v4.0 (Warfare Speed) is active" << std::endl;
    while (true) {
        if (sock == -1) connect_to_gateway();
        handle_commands();
        
        auto nowWall = std::chrono::system_clock::now();
        long long timestampMs = std::chrono::duration_cast<std::chrono::milliseconds>(nowWall.time_since_epoch()).count();
        auto nowSteady = std::chrono::steady_clock::now();
        double timeSec = std::chrono::duration_cast<std::chrono::milliseconds>(nowSteady - startTime).count() * 0.001;

        std::vector<TrackData> tracks;
        for (int i = 0; i < currentTargetCount; i++) {
            // SEBARAN LUAS: Muncul acak di radius 100km tanpa pola lingkaran
            double startLat = -5.5 + (get_random(i, 1.1) - 0.5) * 1.5;
            double startLon = 110.5 + (get_random(i, 2.2) - 0.5) * 1.5;
            
            // ARAH DAN KECEPATAN (100 - 500 KNOTS)
            double knots = 100.0 + (get_random(i, 5.5) * 400.0);
            double headingRad = get_random(i, 3.3) * 6.28318; // Arah acak 0-360 derajat
            
            // Konversi Knots ke pergerakan visual (Skala dipercepat)
            double velocityFactor = knots * 0.0000035; 
            
            TrackData t;
            t.trackId = i;
            t.lat = startLat + (sin(headingRad) * timeSec * velocityFactor);
            t.lon = startLon + (cos(headingRad) * timeSec * velocityFactor);
            t.altitude = (float)(get_random(i, 7.7) * 2000.0); // Variasi altitude (0-2000m)
            t.speed = (float)knots;
            t.heading = (float)(fmod(headingRad * 57.29, 360.0));
            t.timestamp = timestampMs;
            t.classification = (uint8_t)(get_random(i, 6.6) > 0.6 ? 1 : 0);
            tracks.push_back(t);
        }

        if (sock != -1 && !tracks.empty()) {
            uint32_t totalSize = tracks.size() * sizeof(TrackData);
            send(sock, &totalSize, 4, 0);
            send_all(sock, (const char*)tracks.data(), totalSize);
        }
        std::this_thread::sleep_for(std::chrono::milliseconds(200));
    }
    return 0;
}
