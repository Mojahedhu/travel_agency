import { Link, useLocation } from "react-router";
import {
  ChipDirective,
  ChipListComponent,
  ChipsDirective,
} from "@syncfusion/ej2-react-buttons";
import { getFirstWord } from "../app/lib/utils";
const TripCard = ({
  id,
  name,
  location,
  imageUrl,
  tags,
  price,
}: TripCardProps) => {
  const { pathname } = useLocation();

  return (
    <Link
      to={
        pathname === "/" || pathname.startsWith("/travel")
          ? `/travel/${id}`
          : `/trips/${id}`
      }
      className="trip-card"
    >
      <img src={imageUrl} alt={name} />

      <article>
        <figure>
          <h2 className="truncate">{name}</h2>
          <img
            src="/assets/icons/location-mark.svg"
            alt="location"
            className="size-4"
          />
          <figcaption>{location}</figcaption>
        </figure>
      </article>

      <div className="mt-5 pr-3.5 pb-5 pl-4.5">
        <ChipListComponent>
          <ChipsDirective>
            {tags.map((tag, index) => (
              <ChipDirective
                key={"tag" + index}
                text={getFirstWord(tag)}
                cssClass={
                  index === 1
                    ? "bg-pink-50! text-pink-500!"
                    : "bg-success-50! text-success-700!"
                }
              />
            ))}
          </ChipsDirective>
        </ChipListComponent>
      </div>

      <article className="tripCard-pill">{price}</article>
    </Link>
  );
};

export default TripCard;
