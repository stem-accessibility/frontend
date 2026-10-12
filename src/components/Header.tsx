import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import "../components/styles/Header.css";

type NavItemProps = {
  to: string;
  label: string;
  end?: boolean;
};

function NavItem({ to, label, end }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive, isPending }) =>
        [
          "nav-item",
          isActive ? "nav-item--active" : "",
          isPending ? "nav-item--pending" : "",
        ]
          .filter(Boolean)
          .join(" ")
      }
    >
      {label}
    </NavLink>
  );
}

export default function Header() {
  const { user, isLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  const userLabel = user?.email ?? "Signed in";

  return (
    <header className="app-header">
      <div className="app-header__inner">
        <div className="app-header__left">
          <Link
            to={user ? "/dashboard" : "/"}
            className="brand"
            aria-label={user ? "STEM-Accessibility, go to your dashboard" : "STEM-Accessibility home"}
          >
            STEM-Accessibility
          </Link>

          <nav className="app-nav" aria-label="Primary navigation">
            <NavItem to="/about" label="About" />
            <NavItem to="/browse" label="Browse" />
          </nav>
        </div>

        <div className="app-header__right">

          {isLoading ? (
            <span className="header-loading" aria-live="polite">
              Loading…
            </span>
          ) : user ? (
            <>
              <nav className="app-nav" aria-label="Application navigation">
                <NavItem to="/dashboard" label="Dashboard" />
                <Link to="/create" className="btn btn--outline">
                  Create
                </Link>
              </nav>

              <span className="user-chip" title={userLabel} aria-label={`Signed in as ${userLabel}`}>
                {userLabel}
              </span>

              <button type="button" onClick={handleLogout} className="btn btn--outline">
                Log out
              </button>
            </>
          ) : 
          ( <nav className="app-nav" aria-label="Authentication">
              <NavItem to="/try" label="Try it" />
              <NavItem to="/login" label="Log in" />
            </nav>
          )
          }
        </div>
      </div>
    </header>
  );
}
