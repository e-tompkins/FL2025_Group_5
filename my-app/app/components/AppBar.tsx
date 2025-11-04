"use client";

import * as React from "react";
import MuiAppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuIcon from "@mui/icons-material/Menu";
import Container from "@mui/material/Container";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import MenuItem from "@mui/material/MenuItem";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Brightness4, Brightness7 } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";


const pages = [
  { label: "My Visuals", href: "/my-visuals" },
  { label: "Explore", href: "/explore" },
];
const settings = ["Settings", "Logout"];
const LOGO_SRC = "/logo.png";

export default function AppBarComponent() {
  const router = useRouter();
  const theme = useTheme();

  const { data: session } = useSession();

  const avatarSrc = session?.user?.image ?? undefined;
  const displayName = session?.user?.name ?? "User";
  const initials = displayName
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) =>
    setAnchorElNav(event.currentTarget);
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) =>
    setAnchorElUser(event.currentTarget);
  const handleCloseNavMenu = () => setAnchorElNav(null);
  const handleCloseUserMenu = () => setAnchorElUser(null);

  return (
    <MuiAppBar
      position="static"
      elevation={0}
      sx={{
        bgcolor: (theme) =>
          theme.palette.mode === "light" ? "white" : theme.palette.background.paper,
        color: "text.primary",
        borderBottom: (t) =>
          t.palette.mode === "light"
            ? `1px solid ${t.palette.divider}`
            : "1px solid rgba(255,255,255,0.1)",
        boxShadow: 0,
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ minHeight: 64 }}>
          {/* Desktop logo */}
          <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", mr: 3 }}>
            <Box
              onClick={() => router.push("/upload")}
              sx={{
                position: "relative",
                width: 200,
                height: 100,
                cursor: "pointer",
                borderRadius: "8px",
                overflow: "hidden",
                transition: "transform 0.2s ease, opacity 0.2s ease",
                "&:hover": { opacity: 0.8, transform: "scale(1.05)" },
              }}
            >
              <Image
                src={LOGO_SRC}
                alt="VisuaLearn Logo"
                fill
                priority
                style={{ objectFit: "contain", borderRadius: "8px" }}
              />
            </Box>
          </Box>

          {/* Mobile menu + logo */}
          <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" }, alignItems: "center" }}>
            <IconButton size="large" onClick={handleOpenNavMenu} color="inherit">
              <MenuIcon />
            </IconButton>

            <Menu
              anchorEl={anchorElNav}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
              transformOrigin={{ vertical: "top", horizontal: "left" }}
              sx={{ display: { xs: "block", md: "none" } }}
            >
              {pages.map((page) => (
                <MenuItem
                  key={page.label}
                  onClick={() => {
                    handleCloseNavMenu();
                    router.push(page.href);
                  }}
                >
                  <Box sx={{ fontSize: "0.95rem" }}>{page.label}</Box>
                </MenuItem>
              ))}
            </Menu>

            <Box
              onClick={() => router.push("/upload")}
              sx={{
                position: "relative",
                width: 100,
                height: 32,
                cursor: "pointer",
                borderRadius: "6px",
                overflow: "hidden",
                ml: 2,
                transition: "transform 0.2s ease, opacity 0.2s ease",
                "&:hover": { opacity: 0.8, transform: "scale(1.05)" },
              }}
            >
              <Image
                src={LOGO_SRC}
                alt="VisuaLearn Logo"
                fill
                priority
                style={{ objectFit: "cover", borderRadius: "6px" }}
              />
            </Box>
          </Box>

          {/* Desktop nav */}
          <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
            {pages.map((page) => (
              <Button
                key={page.label}
                onClick={() => router.push(page.href)}
                sx={{
                  my: 2,
                  color: "inherit",
                  textTransform: "none",
                  fontWeight: 400,
                  letterSpacing: ".04rem",
                  fontSize: "1.1rem",
                }}
              >
                {page.label}
              </Button>
            ))}
          </Box>

          {/* Right-side controls: theme + avatar */}
          <Box sx={{ flexGrow: 0, display: "flex", alignItems: "center", gap: 1.5 }}>
            {/* 🌙 Dark mode toggle */}
            <IconButton
              sx={{ ml: 1 }}
              onClick={() => {
                const next = theme.palette.mode === "light" ? "dark" : "light";
                localStorage.setItem("theme-mode", next);
                window.location.reload();
              }}
            >
              {theme.palette.mode === "light" ? <Brightness4 /> : <Brightness7 />}
            </IconButton>

            <Tooltip title="Open settings">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar alt={displayName} src={avatarSrc}>
                  {!avatarSrc ? initials : null}
                </Avatar>
              </IconButton>
            </Tooltip>

            <Menu
              sx={{ mt: "45px" }}
              anchorEl={anchorElUser}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
              anchorOrigin={{ vertical: "top", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              {settings.map((setting) => (
                <MenuItem
                  key={setting}
                  onClick={() => {
                    handleCloseUserMenu();
                    if (setting === "Logout") {
                      signOut({ callbackUrl: "/login" });
                    }
                  }}
                >
                  <Box
                    sx={{
                      color: setting === "Logout" ? "error.main" : "inherit",
                      fontWeight: setting === "Logout" ? 600 : 400,
                      textAlign: "center",
                    }}
                  >
                    {setting}
                  </Box>
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </MuiAppBar>
  );
}
