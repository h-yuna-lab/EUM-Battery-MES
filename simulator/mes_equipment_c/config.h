#ifndef CONFIG_H
#define CONFIG_H

/* 원본 C#의 Config/AppConfig.cs에 대응 */

#define BASE_URL "http://localhost:8111/"
#define MACHINE_ID "LINE-01-M01"
#define POLLING_INTERVAL_MS 5000

/* 원본에서는 MachineSimulator.cs에 하드코딩되어 있더 값들.
 * C 포팅에서는 그대로 유지하되 한 파일(config.h)로 모아 정리했다. */
#define L1_IP "127.0.0.1"
#define L1_PORT 5006          /* 기존 유지 - main.c/collector.c가 아직 이걸 씀 (2단계에서 6개 포트로 교체 예정) */

/* L1(mes_machine_c) 6개 설비 포트. 이름은 mes_machine_c/main.c와 통일함 */
#define ELECTRODE_PORT  5006  /* 전극 */
#define ASSEMBLY_PORT   5007  /* 조립 */
#define ACTIVATION_PORT 5008  /* 활성화 */
#define PACK_PORT       5009  /* 팩 */
#define INSPECTION_PORT 5010  /* 검사 */
#define PACKAGING_PORT  5011  /* 포장 */

#endif /* CONFIG_H */
