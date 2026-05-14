#include <emscripten/emscripten.h>
#include <vector>
#include <string>
#include <cmath>
#include <sstream>
#include <iomanip>

struct NodeData { int step; std::string valueStr; size_t offset; };
std::vector<unsigned long long> G_Buf;
std::vector<NodeData> G_Nodes;
std::string G_MaxValStr = "0";
int G_RegCount = 0;
int G_NodeSize = 0;

// Delta tracking
struct DeltaStart { int S; std::string V; size_t Off; };
DeltaStart G_DeltaStart = {0,"0",0};

extern "C" {

// --- Summation ---
EMSCRIPTEN_KEEPALIVE
void runSummation(int base, int exp, int iters, int batch, const char* startBigIntStr) {
    double bit_width = std::ceil(exp * (std::log2(base)));
    G_RegCount = std::ceil(bit_width / 64.0);
    if (G_RegCount < 1) G_RegCount = 1;
    G_NodeSize = G_RegCount * 8;
    G_Buf.clear(); G_Buf.resize(iters * G_RegCount, 0); G_Nodes.clear(); G_MaxValStr = startBigIntStr;
    unsigned long long currentBatchAccumulator = 0;
    for (int i = 1; i <= iters; ++i) {
        currentBatchAccumulator += batch;
        size_t off = (i - 1) * G_RegCount;
        G_Buf[off] = currentBatchAccumulator;
        for (int r = 1; r < G_RegCount; ++r) { G_Buf[off + r] = 0; }
        G_Nodes.push_back({i, startBigIntStr, off});
    }
}

// --- Audit Report between two steps ---
EMSCRIPTEN_KEEPALIVE
const char* generateAuditReport(int startIdx, int endIdx) {
    static std::string result;
    if (startIdx < 1 || endIdx < 1 || startIdx > (int)G_Nodes.size() || endIdx > (int)G_Nodes.size()) {
        result = "Error";
        return result.c_str();
    }
    NodeData startNode = G_Nodes[startIdx - 1]; 
    NodeData endNode = G_Nodes[endIdx - 1];
    std::stringstream ss;
    ss << "AUDIT (Step " << startNode.step << " -> " << endNode.step << ")\n";
    ss << "----------------------------------\n";
    for (int r = 0; r < G_RegCount; ++r) {
        unsigned long long s = G_Buf[startNode.offset + r]; 
        unsigned long long e = G_Buf[endNode.offset + r];
        ss << "REG " << std::setw(2) << std::setfill('0') << (r + 1) << ": "
           << std::setw(16) << std::setfill('0') << std::hex << std::uppercase << s << " -> "
           << std::setw(16) << std::setfill('0') << std::hex << std::uppercase << e << " | XOR: "
           << std::setw(16) << std::setfill('0') << std::hex << std::uppercase << (s ^ e) << "\n";
    }
    result = ss.str();
    return result.c_str();
}

// --- Analyze Matrix (demo: sqrt of max value string) ---
EMSCRIPTEN_KEEPALIVE
const char* analyzeMatrix() {
    static std::string result;
    long double val = std::stold(G_MaxValStr);
    long double root = std::sqrt(val);
    std::stringstream ss;
    ss << "MATRIX Root (n): " << (unsigned long long)root;
    result = ss.str();
    return result.c_str();
}

// --- Calc Remaining ---
EMSCRIPTEN_KEEPALIVE
int calcRemaining(int base, int exp, int batch) {
    long double target = std::pow((long double)base, (long double)exp);
    long double maxVal = std::stold(G_MaxValStr);
    long double rem = (target - maxVal) / batch;
    return (int)rem;
}

// --- Bracket Logic ---
EMSCRIPTEN_KEEPALIVE
const char* runBracket(const char* input) {
    static std::string result;
    result = "BRACKET BINARY AUDIT ({=0, }=1):\n";
    std::vector<int> stack;
    std::string str(input);
    for (size_t i = 0; i < str.size(); i++) {
        if (str[i] == '{') stack.push_back(i+1);
        else if (str[i] == '}' && !stack.empty()) {
            int start = stack.back(); stack.pop_back();
            std::stringstream ss;
            ss << "Match: Pos " << start << "-" << (i+1) << " | VALID\n";
            result += ss.str();
        }
    }
    return result.c_str();
}

// --- Helpers ---
EMSCRIPTEN_KEEPALIVE
int getBufferSize() { return G_Buf.size() * 8; }

EMSCRIPTEN_KEEPALIVE
int getArchBits() { return G_RegCount * 64; }

}
