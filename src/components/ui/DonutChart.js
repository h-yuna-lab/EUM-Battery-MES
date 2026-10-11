import styled from "styled-components";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const toCssSize = (value, fallback) => {
  if (value === undefined || value === null) return fallback;
  return typeof value === "number" ? `${value}px` : value;
};

const Wrapper = styled.div`
  width: ${({ $width }) => toCssSize($width, "100%")};
  min-height: ${({ $height }) => toCssSize($height, "180px")};

  display: flex;
  flex-direction: ${({ $legendPosition }) =>
    $legendPosition === "bottom" ? "column" : "row"};
  align-items: center;
  justify-content: ${({ $justifyContent }) => $justifyContent};
  gap: ${({ $gap }) => toCssSize($gap, "24px")};

  box-sizing: border-box;
`;

const ChartArea = styled.div`
  position: relative;

  width: ${({ $size }) => toCssSize($size, "150px")};
  height: ${({ $size }) => toCssSize($size, "150px")};

  flex-shrink: 0;
`;

const CenterText = styled.div`
  position: absolute;
  inset: 0;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  pointer-events: none;
`;

const TotalValue = styled.strong`
  font-size: ${({ $fontSize }) => toCssSize($fontSize, "28px")};
  font-weight: ${({ $fontWeight }) => $fontWeight};
  line-height: 1;
  color: ${({ $color }) => $color};
`;

const TotalLabel = styled.span`
  margin-top: 8px;

  font-size: ${({ $fontSize }) => toCssSize($fontSize, "13px")};
  font-weight: ${({ $fontWeight }) => $fontWeight};
  color: ${({ $color }) => $color};
`;

const Legend = styled.div`
  display: flex;
  flex-direction: ${({ $legendPosition }) =>
    $legendPosition === "bottom" ? "row" : "column"};
  flex-wrap: wrap;
  gap: ${({ $gap }) => toCssSize($gap, "14px")};
`;

const LegendItem = styled.div`
  display: grid;
  grid-template-columns: auto minmax(50px, 1fr) auto;
  align-items: center;
  column-gap: 9px;

  font-size: ${({ $fontSize }) => toCssSize($fontSize, "14px")};
`;

const LegendDot = styled.span`
  width: ${({ $size }) => toCssSize($size, "10px")};
  height: ${({ $size }) => toCssSize($size, "10px")};

  border-radius: 50%;
  background: ${({ $color }) => $color};
`;

const LegendName = styled.span`
  color: ${({ $color }) => $color};
`;

const LegendValue = styled.strong`
  margin-left: 12px;
  color: ${({ $color }) => $color};
`;

const EmptyCircle = styled.div`
  width: 100%;
  height: 100%;

  border: ${({ $thickness, $color }) =>
    `${toCssSize($thickness, "14px")} solid ${$color}`};

  border-radius: 50%;
  box-sizing: border-box;
`;

function DonutChart({
  data = [],

  width = "100%",
  height = 180,
  chartSize = 150,

  innerRadius = 50,
  outerRadius = 68,

  total,
  totalLabel = "전체",

  totalFontSize = 28,
  totalFontWeight = 700,
  totalColor = "#111827",

  totalLabelFontSize = 13,
  totalLabelFontWeight = 400,
  totalLabelColor = "#9ca3af",

  showLegend = true,
  legendPosition = "right",
  legendGap = 14,
  legendFontSize = 14,
  legendDotSize = 10,
  legendNameColor = "#4b5563",
  legendValueColor = "#111827",

  showTooltip = false,
  gap = 24,
  justifyContent = "flex-start",

  startAngle = 90,
  endAngle = -270,
  paddingAngle = 0,

  emptyColor = "#e5e7eb",
  emptyThickness = 14,

  animation = true,
  valueFormatter = (value) => value,
}) {
  const calculatedTotal = data.reduce(
    (sum, item) => sum + Number(item.value || 0),
    0
  );

  const displayTotal = total ?? calculatedTotal;
  const hasData = calculatedTotal > 0;

  return (
    <Wrapper
      $width={width}
      $height={height}
      $gap={gap}
      $legendPosition={legendPosition}
      $justifyContent={justifyContent}
    >
      <ChartArea $size={chartSize}>
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                startAngle={startAngle}
                endAngle={endAngle}
                paddingAngle={paddingAngle}
                stroke="none"
                isAnimationActive={animation}
              >
                {data.map((item, index) => (
                  <Cell
                    key={`${item.name}-${index}`}
                    fill={item.color}
                  />
                ))}
              </Pie>

              {showTooltip && (
                <Tooltip
                  formatter={(value, name) => [
                    valueFormatter(value),
                    name,
                  ]}
                />
              )}
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <EmptyCircle
            $color={emptyColor}
            $thickness={emptyThickness}
          />
        )}

        <CenterText>
          <TotalValue
            $fontSize={totalFontSize}
            $fontWeight={totalFontWeight}
            $color={totalColor}
          >
            {valueFormatter(displayTotal)}
          </TotalValue>

          <TotalLabel
            $fontSize={totalLabelFontSize}
            $fontWeight={totalLabelFontWeight}
            $color={totalLabelColor}
          >
            {totalLabel}
          </TotalLabel>
        </CenterText>
      </ChartArea>

      {showLegend && (
        <Legend
          $legendPosition={legendPosition}
          $gap={legendGap}
        >
          {data.map((item) => (
            <LegendItem
              key={item.name}
              $fontSize={legendFontSize}
            >
              <LegendDot
                $color={item.color}
                $size={legendDotSize}
              />

              <LegendName $color={legendNameColor}>
                {item.name}
              </LegendName>

              <LegendValue $color={legendValueColor}>
                {valueFormatter(item.value)}
              </LegendValue>
            </LegendItem>
          ))}
        </Legend>
      )}
    </Wrapper>
  );
}

export default DonutChart;