const InfoPill = ({ image, text }: InfoPillProps) => {
  return (
    <figure className="info-pill">
      <img src={image} alt={""} />
      <figcaption>{text}</figcaption>
    </figure>
  );
};

export default InfoPill;
