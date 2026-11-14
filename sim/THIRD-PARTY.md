# sim/ 제3자 자료

| 무엇 | 쓰임 | 라이선스 | 저장소에 넣나 |
|---|---|---|---|
| three 0.187.0 (https://threejs.org) | 3D 렌더, HDRLoader | MIT | npm 의존성 (node_modules 미포함) |
| vite 8 · typescript 7 · @types/three | 개발 서버·빌드·타입 | MIT · Apache-2.0 · MIT | npm 개발 의존성 |
| Poly Haven HDRI 1k: kloppenheim_06_puresky · qwantani_dusk_2_puresky · moonless_golf (https://polyhaven.com) | 환경광만 (배경으로 안 보임) | CC0 (표기 의무 없음) | 아니오. `scripts/fetch-hdri.sh`로 받음, `.gitignore` |
| Pretendard (글꼴, 설치돼 있으면 사용) | 간판 글자 캔버스 | SIL OFL 1.1 | 아니오 (시스템 글꼴, 없으면 시스템 한글 글꼴) |

현대차 공식: Pleos Virtual Console HTTP API(경로·필드 이름)만 호출한다. 콘솔의 3D 모델(`/glb/*.glb`)·화면은 SDK 약관상 복제·재배포 금지라 쓰지 않는다.
차·건물·사람은 모두 이 저장소 코드로 만든 것이며, 특정 차종 형상·상표·실재 학원 이름을 쓰지 않는다.
