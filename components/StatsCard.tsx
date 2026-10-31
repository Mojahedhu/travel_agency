import { calculateTrendPercentage, cn } from "../app/lib/utils";

const StatsCard = ({
  headerTitle,
  total,
  currentMonthCount,
  lastMonthCount,
}: StatsCard) => {
  const { trend, percentage } = calculateTrendPercentage(
    currentMonthCount,
    lastMonthCount,
  );

  const isDecrement = trend === "decrement";

  return (
    <article className="stats-card">
      <h3 className="text-base font-medium">{headerTitle}</h3>

      <div className="content">
        <div className="flex flex-col gap-4">
          <h2 className="text-4xl font-semibold">{total.toLocaleString()}</h2>

          <div className="flex items-center gap-2 max-md:flex-1 max-md:gap-3">
            <figure className="flex items-center gap-1">
              <img
                src={`/assets/icons/${isDecrement ? "arrow-down-red.svg" : "arrow-up-green.svg"}`}
                className="size-5"
              />
              <figcaption
                className={cn(
                  "text-sm font-semibold",
                  isDecrement ? "text-red-500" : "text-success-700",
                )}
              >
                {Math.round(percentage)}%
              </figcaption>
            </figure>
            <p className="truncate text-sm font-medium text-gray-100">
              vs last month
            </p>
          </div>
        </div>
        <img
          src={`/assets/icons/${isDecrement ? "decrement.svg" : "increment.svg"}`}
          className="h-full w-full md:h-32 xl:h-full xl:w-32"
          alt="trend graph"
        />
      </div>
    </article>
  );
};

export default StatsCard;
