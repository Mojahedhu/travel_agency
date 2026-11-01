import { Link, redirect } from "react-router";
import { account } from "../../appwrite/client";
import { ButtonComponent } from "@syncfusion/ej2-react-buttons";
import { loginWidthGoogle } from "../../appwrite/auth";

export const clientLoader = async () => {
  try {
    const user = await account.get();

    if (user.$id) return redirect("/");
  } catch (error) {
    console.log("Error fetching user", error);
  }
};

const SignIn = () => {
  return (
    <main className="auth">
      <section className="glassmorphism flex-center size-full px-6">
        <div className="sign-in-card">
          <header className="header">
            <Link to={"/"}>
              <img
                src="/assets/icons/logo.svg"
                alt="logo"
                className="size-7.5"
              />
            </Link>
            <h1 className="p-28-bold">Worldvisto</h1>
          </header>

          <article>
            <h2 className="p-28-semibold text-dark-100 text-center">
              Start Your Travel Journey
            </h2>
            <p className="p-18-regular text-center leading-7! text-gray-100">
              Sign in with Google to manage destinations, itineraries, and user
              activities with ease.
            </p>
          </article>

          <ButtonComponent
            type="button"
            iconCss="e-search-icon"
            className="button-class h-11! w-full!"
            onClick={loginWidthGoogle}
          >
            <img
              src="/assets/icons/google.svg"
              className="size-5"
              alt="google"
            />
            <span className="p-18-semibold text-white">
              Sign in with Google
            </span>
          </ButtonComponent>
        </div>
      </section>
    </main>
  );
};

export default SignIn;
