import { useEffect, useState } from "react";
import styled from "styled-components";
import { FiX } from "react-icons/fi";
import Button from "../../components/ui/Button";
import masterApi from "../../api/master";

export default function ProductDetail({
  isOpen,
  product,
  onClose,
  onEdit,
  canEdit = true,
}) {
  const [bomRows, setBomRows] = useState([]);
  const [isBomLoading, setIsBomLoading] = useState(false);
  const [bomError, setBomError] = useState("");

  useEffect(() => {
    if (!isOpen || !product?.id) {
      setBomRows([]);
      setBomError("");
      return undefined;
    }

    let isMounted = true;

    const loadBomRows = async () => {
      setIsBomLoading(true);
      setBomError("");

      try {
        const response = await masterApi.getBomItems(product.id);
        if (!isMounted) return;
        setBomRows(response.data ?? []);
      } catch (error) {
        console.error("제품 상세 BOM 조회 실패:", error);
        if (!isMounted) return;
        setBomRows([]);
        setBomError("BOM 정보를 불러오지 못했습니다.");
      } finally {
        if (isMounted) {
          setIsBomLoading(false);
        }
      }
    };

    loadBomRows();

    return () => {
      isMounted = false;
    };
  }, [isOpen, product?.id]);

  useEffect(() => {
    if (!isOpen || !product) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, product, onClose]);

  if (!isOpen || !product) return null;

  return (
    <>
      <Backdrop onClick={onClose} />

      <Drawer
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-detail-title"
      >
        <Header>
          <Title id="product-detail-title">제품 상세 조회</Title>

          <Close type="button" onClick={onClose} aria-label="닫기">
            <FiX />
          </Close>
        </Header>

        <Body>
          <SectionTitle>제품 정보</SectionTitle>

          <Field>
            <Label>제품명</Label>
            <Value>{product.product_name}</Value>
          </Field>

          <Field>
            <Label>제품 코드</Label>
            <Value $code>{product.product_code}</Value>
          </Field>

          <Grid>
            <Field>
              <Label>전압(V)</Label>
              <Value>{product.voltage}V</Value>
            </Field>

            <Field>
              <Label>용량(Ah)</Label>
              <Value>{product.capacity_ah}Ah</Value>
            </Field>
          </Grid>

          <Field>
            <Label>단위</Label>
            <Value>{product.unit}</Value>
          </Field>

          <History>
            <SectionTitle>BOM 구성 정보</SectionTitle>

            <TableWrap>
              <table>
                <thead>
                  <tr>
                    <th>자재 코드</th>
                    <th>자재명</th>
                    <th>소요량</th>
                    <th>단위</th>
                    <th>투입 공정</th>
                  </tr>
                </thead>

                <tbody>
                  {isBomLoading && (
                    <tr>
                      <td colSpan="5" style={{ color: "#6b7280" }}>
                        BOM 정보를 불러오는 중입니다.
                      </td>
                    </tr>
                  )}

                  {!isBomLoading && bomError && (
                    <tr>
                      <td colSpan="5" style={{ color: "#dc2626" }}>
                        {bomError}
                      </td>
                    </tr>
                  )}

                  {!isBomLoading && !bomError && bomRows.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ color: "#9ca3af" }}>
                        등록된 BOM 정보가 없습니다.
                      </td>
                    </tr>
                  )}

                  {!isBomLoading &&
                    !bomError &&
                    bomRows.map((item) => (
                      <tr key={item.id}>
                        <CodeCell title={item.materialCode}>{item.materialCode}</CodeCell>
                        <td>{item.materialName}</td>
                        <td>{Number(item.requiredQuantity ?? 0).toLocaleString()}</td>
                        <td>{item.unit}</td>
                        <td>{item.inputProcessName}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </TableWrap>
          </History>
        </Body>

        <Footer>
          <ActionButton type="button" variant="outline" onClick={onClose}>
            닫기
          </ActionButton>

          {canEdit && (
            <ActionButton type="button" $primary onClick={onEdit}>
              수정
            </ActionButton>
          )}
        </Footer>
      </Drawer>
    </>
  );
}

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 999;
  background: rgba(15, 23, 42, 0.38);
`;

const Drawer = styled.aside`
  position: fixed;
  top: 0;
  right: 0;
  z-index: 1000;
  width: min(600px, 100%);
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background: #fff;
  box-shadow: -12px 0 36px rgba(15, 23, 42, 0.18);
  animation: open 0.24s ease-out;

  @keyframes open {
    from {
      transform: translateX(100%);
    }
    to {
      transform: none;
    }
  }
`;

const Header = styled.header`
  min-height: 86px;
  padding: 0 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #d9deea;
`;

const Title = styled.h2`
  margin: 0;
  color: #202738;
  font-size: 20px;
  font-weight: 700;
`;

const Close = styled.button`
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 6px;
  color: #6f788b;
  font-size: 23px;
  background: none;
  border: none;
  cursor: pointer;

  &:hover {
    background: #f1f3f8;
  }
`;

const Body = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 32px 30px;
`;

const SectionTitle = styled.h3`
  margin: 0 0 24px;
  color: #202738;
  font-size: 18px;
  font-weight: 700;
`;

const Field = styled.div`
  margin-bottom: 18px;
`;

const Label = styled.span`
  display: block;
  margin-bottom: 7px;
  color: #616b7e;
  font-size: 12px;
`;

const Value = styled.div`
  min-height: 42px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  border: 1px solid #c7cddd;
  border-radius: 8px;
  background: #f7f8fd;
  color: ${({ $code }) => ($code ? "#084693" : "#262d3c")};
  font-family: ${({ $code }) =>
    $code ? "var(--font-family-mono)" : "inherit"};
  font-size: 13px;
  font-weight: ${({ $code }) => ($code ? 700 : 500)};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
    gap: 0;
  }
`;

const History = styled.section`
  margin-top: 38px;
`;

const TableWrap = styled.div`
  overflow-x: auto;
  border: 1px solid #c7cddd;
  border-radius: 8px;

  table {
    width: 100%;
    min-width: 500px;
    border-collapse: collapse;
    table-layout: fixed;
  }

  th,
  td {
    height: 44px;
    padding: 0 16px;
    border-bottom: 1px solid #c7cddd;
    color: #303748;
    font-size: 12px;
    text-align: center;
    vertical-align: middle;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  th {
    background: #eef0f8;
    font-weight: 700;
  }

  tr:last-child td {
    border-bottom: 0;
  }
`;

const CodeCell = styled.td`
  font-family: var(--font-family-mono);
  color: #084693;
  font-weight: 700;
`;

const Footer = styled.footer`
  flex-shrink: 0;
  padding: 16px 24px;

  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;

  border-top: 1px solid #dfe3eb;
  background: #fff;
`;

const ActionButton = styled(Button)`
  height: 40px;
  padding: 0 20px;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;

  flex-shrink: 0;

  border: ${({ $primary }) => ($primary ? "0" : "1px solid #d2d8e1")};
  border-radius: 7px;

  background: ${({ $primary }) => ($primary ? "#0755d9" : "#fff")};
  color: ${({ $primary }) => ($primary ? "#fff" : "#4b5563")};

  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }
`;
