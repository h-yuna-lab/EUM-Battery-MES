#include "protocol.h"

void packet_build(uint8_t out7[PACKET_SIZE], uint8_t msg_type, int32_t value)
{
    uint32_t v = (uint32_t)value;

    out7[0] = STX;
    out7[1] = msg_type;
    out7[2] = (uint8_t)(v & 0xFF);
    out7[3] = (uint8_t)((v >> 8) & 0xFF);
    out7[4] = (uint8_t)((v >> 16) & 0xFF);
    out7[5] = (uint8_t)((v >> 24) & 0xFF);
    out7[6] = ETX;
}

int packet_validate(const uint8_t buf7[PACKET_SIZE])
{
    return (buf7[0] == STX) && (buf7[6] == ETX);
}

uint8_t packet_get_type(const uint8_t buf7[PACKET_SIZE])
{
    return buf7[1];
}

int32_t packet_get_value(const uint8_t buf7[PACKET_SIZE])
{
    uint32_t v = (uint32_t)buf7[2]
               | ((uint32_t)buf7[3] << 8)
               | ((uint32_t)buf7[4] << 16)
               | ((uint32_t)buf7[5] << 24);
    return (int32_t)v;
}

/* buf의 offset 위치에 value를 리틀엔디언 4바이트로 써넣는다 */
static void write_le32(uint8_t *buf, int32_t value)
{
    uint32_t v = (uint32_t)value;
    buf[0] = (uint8_t)(v & 0xFF);
    buf[1] = (uint8_t)((v >> 8) & 0xFF);
    buf[2] = (uint8_t)((v >> 16) & 0xFF);
    buf[3] = (uint8_t)((v >> 24) & 0xFF);
}

/* buf에서 리틀엔디언 4바이트를 읽어 int32_t로 복원한다 */
static int32_t read_le32(const uint8_t *buf)
{
    uint32_t v = (uint32_t)buf[0]
               | ((uint32_t)buf[1] << 8)
               | ((uint32_t)buf[2] << 16)
               | ((uint32_t)buf[3] << 24);
    return (int32_t)v;
}

void quality_packet_build(uint8_t out16[QUALITY_PACKET_SIZE], const QualityData *data)
{
    out16[0] = STX;
    out16[1] = MSG_INSPECTION_QUALITY;
    write_le32(&out16[2], data->voltage_x100);
    write_le32(&out16[6], data->capacity_x1000);
    write_le32(&out16[10], data->resistance_mohm);
    out16[14] = 0; /* reserved */
    out16[15] = ETX;
}

int quality_packet_validate(const uint8_t buf16[QUALITY_PACKET_SIZE])
{
    return (buf16[0] == STX) && (buf16[15] == ETX);
}

void quality_packet_get(const uint8_t buf16[QUALITY_PACKET_SIZE], QualityData *out)
{
    out->voltage_x100 = read_le32(&buf16[2]);
    out->capacity_x1000 = read_le32(&buf16[6]);
    out->resistance_mohm = read_le32(&buf16[10]);
}
