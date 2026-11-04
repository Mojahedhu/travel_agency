import { useState, type SubmitEvent } from "react";
import { ComboBoxComponent } from "@syncfusion/ej2-react-dropdowns";
import {
  LayerDirective,
  LayersDirective,
  MapsComponent,
} from "@syncfusion/ej2-react-maps";
import { comboBoxItems, countries, selectItems } from "../../constants";
import { Header } from "../../../components";
import { cn, formatKey } from "../../lib/utils";
import { world_map } from "../../constants/world_map";
import { ButtonComponent } from "@syncfusion/ej2-react-buttons";
import { account } from "../../appwrite/client";
import { useNavigate } from "react-router";

const CreateTrip = () => {
  const [formData, setFormData] = useState<TripFormData>({
    country: countries[1]?.value || "",
    travelStyle: "",
    interest: "",
    budget: "",
    duration: 0,
    groupType: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    if (
      !formData.country ||
      !formData.travelStyle ||
      !formData.interest ||
      !formData.budget ||
      !formData.groupType
    ) {
      setError("Please provide values for all fields");
      setLoading(false);
      return;
    }

    if (formData.duration < 1 || formData.duration > 10) {
      setError("Duration must be between 1 and 10 days");
      setLoading(false);
      return;
    }

    const user = await account.get();
    if (!user.$id) {
      setError("User not authenticated");
      setLoading(false);
      return;
    }

    // 👉 1. Generate a temporary, secure JWT from the active Appwrite session
    const { jwt } = await account.createJWT();

    try {
      const response = await fetch("/api/create-trip", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          // 👉 2. Pass the JWT to your server
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          country: formData.country,
          numberOfDays: formData.duration,
          travelStyle: formData.travelStyle,
          interests: formData.interest,
          budget: formData.budget,
          groupType: formData.groupType,
        }),
      });

      const result: CreateTripResponse = await response.json();

      // 👉 Handle 400 / 401 / 500 responses from the backend
      if (!response.ok) {
        // 1. If there's an issues list with messages, join them; otherwise use error
        let errorMessage = result.error || "Failed to generate trip.";
        if (result.issues && result.issues.length > 0) {
          errorMessage = result.issues.map((i) => i.message).join(" • ");
        }
        setError(errorMessage);
        return;
      }

      if (result?.id) navigate(`/trips/${result.id}`);
      else console.error("Failed to generate a trip. No ID returned.");
    } catch (error) {
      console.log("Error generate trip", error);
      setError(error || "A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: keyof TripFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const countryData = countries.map((country) => ({
    text: country.name,
    value: country.value,
  }));

  const mapData = [
    {
      country: formData.country,
      color: "#EA382E",
      coordinate:
        countries.find((c) => c.value === formData.country)?.coordinates || [],
    },
  ];

  return (
    <main className="wrapper flex flex-col gap-10 pb-20">
      <Header
        title="Add a New Trip"
        description="View and edit AI Generated plans"
      />

      <section className="wrapper-md mt-2.5">
        <form
          aria-labelledby={error ? "form-error" : null}
          className="trip-form"
          onSubmit={handleSubmit}
        >
          <div>
            <label htmlFor="country">Country</label>
            <ComboBoxComponent
              htmlAttributes={{ "aria-label": "Country" }}
              id="country"
              dataSource={countryData}
              fields={{ text: "text", value: "value" }}
              placeholder="Select a Country"
              value={formData.country || ""}
              onChange={(e: { value: string | undefined }) => {
                handleChange("country", e.value || "");
              }}
              allowFiltering
              allowCustom={false}
              filtering={(e) => {
                const query = e.text.toLowerCase();

                e.updateData(
                  countries
                    .filter((country) =>
                      country.name.toLowerCase().includes(query),
                    )
                    .map((country) => ({
                      text: country.name,
                      value: country.value,
                    })),
                );
              }}
              className="combo-box font-flags!"
            />
          </div>

          <div>
            <label htmlFor="duration">Duration</label>
            <input
              id="duration"
              name="duration"
              min={1}
              max={10}
              required
              aria-required="true"
              value={formData.duration || ""}
              type="number"
              placeholder="Enter a number of days"
              className="form-input mr-7.5 placeholder:text-gray-400"
              onChange={(e) => handleChange("duration", Number(e.target.value))}
            />
          </div>

          {selectItems.map((key) => (
            <div key={key}>
              <label htmlFor={key}>{formatKey(key)}</label>

              <ComboBoxComponent
                id={key}
                htmlAttributes={{ "aria-label": formatKey(key) }}
                dataSource={comboBoxItems[key].map((item) => ({
                  text: item,
                  value: item,
                }))}
                fields={{ text: "text", value: "value" }}
                placeholder={`Select ${formatKey(key)}`}
                value={formData[key] || ""}
                onChange={(e: { value: string | undefined }) => {
                  handleChange(key, e.value || "");
                }}
                allowFiltering
                allowCustom={false}
                filtering={(e) => {
                  const query = e.text.toLowerCase();

                  e.updateData(
                    comboBoxItems[key]
                      .filter((item) => item.toLowerCase().includes(query))
                      .map((item: string) => ({ text: item, value: item })),
                  );
                }}
                className="combo-box"
              />
            </div>
          ))}

          <div>
            <p id="map-heading" className="label-style">
              Location on the world map
            </p>
            <div aria-hidden className="m-0 p-0">
              <MapsComponent id="location">
                <LayersDirective>
                  <LayerDirective
                    shapeData={world_map}
                    dataSource={mapData}
                    shapePropertyPath="name"
                    shapeDataPath="country"
                    shapeSettings={{ colorValuePath: "color", fill: "#E5E5E5" }}
                  />
                </LayersDirective>
              </MapsComponent>
            </div>
          </div>

          <div className="h-px w-full bg-gray-100" />

          {/* {error && (
            <div
              id="form-error"
              className="error"
              role="alert"
              aria-live="assertive"
            >
              <p>{error}</p>
            </div>
          )} */}
          {error && (
            <div
              id="form-error"
              className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              role="alert"
              aria-live="assertive"
            >
              <svg
                className="size-5 shrink-0 text-red-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="font-medium">{error}</p>
            </div>
          )}

          <footer className="w-full px-6">
            <ButtonComponent
              type="submit"
              className="button-class h-12! w-full!"
              disabled={loading}
              aria-busy={loading}
            >
              <img
                src={`/assets/icons/${loading ? "loader.svg" : "magic-star.svg"}`}
                className={cn("size-5", { "animate-spin": loading })}
                alt=""
                aria-hidden
              />
              <span className="p-16-semibold text-white">
                {loading ? "Generating..." : "Generate Trip"}
              </span>
            </ButtonComponent>
          </footer>
        </form>
      </section>
    </main>
  );
};

export default CreateTrip;
