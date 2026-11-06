import cn from "clsx";
interface DestinationProps {
  containerClass?: string;
  bigCard?: boolean;
  activityCount: number;
  rating: number;
  bgImage: string;
  title: string;
}

const FeaturedDestination = ({
  containerClass,
  bigCard,
  activityCount,
  rating,
  bgImage,
  title,
}: DestinationProps) => {
  return (
    <section
      className={cn(
        "size-full min-w-70 overflow-hidden rounded-[14px] bg-cover bg-center",
        containerClass,
        bgImage,
      )}
    >
      <div className="h-full bg-linear-200">
        <article className="featured-card">
          <div
            className={cn(
              "rounded-20 w-fit bg-white px-3 py-px text-sm font-bold text-red-100",
            )}
          >
            {rating}
          </div>

          <article className="flex flex-col gap-3.5">
            <h3
              className={cn("text-lg font-semibold text-white", {
                "p-30-bold": bigCard,
              })}
            >
              {title}
            </h3>

            <figure className="flex items-center gap-2">
              <img
                src="/assets/images/david.webp"
                alt="user"
                className={cn("aspect-square size-4 rounded-full", {
                  "size-11": bigCard,
                })}
              />
              <p
                className={cn("text-xs font-normal text-white", {
                  "text-lg": bigCard,
                })}
              >
                {activityCount} activities
              </p>
            </figure>
          </article>
        </article>
      </div>
    </section>
  );
};

export default FeaturedDestination;
