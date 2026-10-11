import styled from "styled-components";

const toCssSize = (value, fallback) => {
  if (value === undefined || value === null) return fallback;
  return typeof value === "number" ? `${value}px` : value;
};

const Card = styled.div`
  width: ${({ $width }) => toCssSize($width, "100%")};
  height: ${({ $height }) => toCssSize($height, "auto")};
  min-width: 0;

  padding: ${({ $padding }) => toCssSize($padding, "18px")};

  background: ${({ $background }) => $background};
  border: ${({ $border }) => $border};
  border-radius: ${({ $borderRadius }) =>
    toCssSize($borderRadius, "18px")};

  display: flex;
  flex-direction: column;
  gap: ${({ $gap }) => toCssSize($gap, "22px")};

  box-sizing: border-box;
  box-shadow: ${({ $boxShadow }) => $boxShadow};

  cursor: ${({ $clickable }) => ($clickable ? "pointer" : "default")};

  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: ${({ $clickable }) =>
      $clickable ? "translateY(-2px)" : "none"};

    box-shadow: ${({ $clickable, $boxShadow }) =>
      $clickable ? "0 6px 16px rgba(15, 23, 42, 0.1)" : $boxShadow};
  }
`;

const IconBox = styled.div`
  width: ${({ $size }) => toCssSize($size, "72px")};
  height: ${({ $size }) => toCssSize($size, "72px")};

  display: flex;
  align-items: center;
  justify-content: center;

  flex-shrink: 0;

  background: ${({ $background }) => $background};
  border-radius: ${({ $borderRadius }) =>
    toCssSize($borderRadius, "18px")};

  color: ${({ $color }) => $color};

  svg {
    width: ${({ $iconSize }) => toCssSize($iconSize, "36px")};
    height: ${({ $iconSize }) => toCssSize($iconSize, "36px")};
  }
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const Title = styled.span`
  margin-bottom: ${({ $marginBottom }) =>
    toCssSize($marginBottom, "10px")};

  font-size: ${({ $fontSize }) => toCssSize($fontSize, "18px")};
  font-weight: ${({ $fontWeight }) => $fontWeight};
  color: ${({ $color }) => $color};

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Value = styled.strong`
  font-size: ${({ $fontSize }) => toCssSize($fontSize, "46px")};
  font-weight: ${({ $fontWeight }) => $fontWeight};
  line-height: 1.1;
  color: ${({ $color }) => $color};

  overflow-wrap: anywhere;
`;

const Description = styled.span`
  margin-top: ${({ $marginTop }) => toCssSize($marginTop, "10px")};

  font-size: ${({ $fontSize }) => toCssSize($fontSize, "16px")};
  font-weight: ${({ $fontWeight }) => $fontWeight};
  color: ${({ $color }) => $color};
`;

function SummaryCard({
  icon,
  title,
  value,
  description,

  width = "100%",
  height = "auto",
  padding = 18,
  gap = 22,

  background = "#ffffff",
  border = "1px solid #d8dde8",
  borderRadius = 18,
  boxShadow = "0 2px 6px rgba(15, 23, 42, 0.04)",

  iconBoxSize = 72,
  iconSize = 36,
  iconBackground = "#dfe4ff",
  iconColor = "#0b57d0",
  iconBorderRadius = 18,

  titleFontSize = 18,
  titleFontWeight = 500,
  titleColor = "#4b5563",

  valueFontSize = 46,
  valueFontWeight = 700,
  valueColor = "#111827",

  descriptionFontSize = 16,
  descriptionFontWeight = 400,
  descriptionColor = "#9ca3af",

  onClick,
  className,
}) {
  return (
    <Card
      className={className}
      onClick={onClick}
      $width={width}
      $height={height}
      $padding={padding}
      $gap={gap}
      $background={background}
      $border={border}
      $borderRadius={borderRadius}
      $boxShadow={boxShadow}
      $clickable={Boolean(onClick)}
    >
      {icon && (
        <IconBox
          $size={iconBoxSize}
          $iconSize={iconSize}
          $background={iconBackground}
          $color={iconColor}
          $borderRadius={iconBorderRadius}
        >
          {icon}
        </IconBox>
      )}

      <Content>
        {title && (
          <Title
            $fontSize={titleFontSize}
            $fontWeight={titleFontWeight}
            $color={titleColor}
          >
            {title}
          </Title>
        )}

        <Value
          $fontSize={valueFontSize}
          $fontWeight={valueFontWeight}
          $color={valueColor}
        >
          {value}
        </Value>

        {description && (
          <Description
            $fontSize={descriptionFontSize}
            $fontWeight={descriptionFontWeight}
            $color={descriptionColor}
          >
            {description}
          </Description>
        )}
      </Content>
    </Card>
  );
}

export default SummaryCard;
