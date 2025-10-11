"use client";

import * as React from "react";
import MuiAppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
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

const pages = ["My Visuals", "Explore"];
const settings = ["Settings", "Logout"];
const LOGO_SRC = "/logo.png"; // update if you renamed the file

export default function AppBarComponent() {
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

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => setAnchorElNav(event.currentTarget);
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => setAnchorElUser(event.currentTarget);
  const handleCloseNavMenu = () => setAnchorElNav(null);
  const handleCloseUserMenu = () => setAnchorElUser(null);

  return (
    <MuiAppBar
      position="static"
      sx={{
        bgcolor: "white",
        color: "text.primary",
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        boxShadow: 0,
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ minHeight: 64 }}>
          {/* Desktop logo */}
          <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", mr: 2 }}>
            <Image
              src={LOGO_SRC}
              alt="VisuaLearn Logo"
              width={200}
              height={200}
              priority
              style={{ objectFit: "contain", borderRadius: 6 }}
            />
          </Box>

          {/* (Optional) Brand text */}
          <Typography
            variant="h6"
            noWrap
            component="a"
            href="/"
            sx={{
              mr: 2,
              display: { xs: "none", md: "flex" },
              fontWeight: 700,
              letterSpacing: ".08rem",
              color: "inherit",
              textDecoration: "none",
            }}
          >
          </Typography>

          {/* Mobile: menu + small logo */}
          <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" }, alignItems: "center" }}>
            <IconButton size="large" aria-label="menu" onClick={handleOpenNavMenu} color="inherit">
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
                <MenuItem key={page} onClick={handleCloseNavMenu}>
                  <Typography textAlign="center">{page}</Typography>
                </MenuItem>
              ))}
            </Menu>

            <Box sx={{ display: "flex", alignItems: "center", ml: 2 }}>
              <Image
                src={LOGO_SRC}
                alt="VisuaLearn Logo"
                width={32}
                height={32}
                style={{ objectFit: "contain", borderRadius: 6 }}
              />
            </Box>
          </Box>

          {/* Desktop navigation */}
          <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
            {pages.map((page) => (
              <Button
                key={page}
                onClick={handleCloseNavMenu}
                sx={{
                  my: 2,
                  color: "inherit",
                  fontFamily: "'Poppins', 'Montserrat', sans-serif",
                  textTransform: "none",
                  fontWeight: 600,
                  letterSpacing: ".04rem",
                }}
              >
                {page}
              </Button>
            ))}
          </Box>

          {/* Avatar menu (uses Google photo) */}
          <Box sx={{ flexGrow: 0 }}>
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
                  <Typography
                    textAlign="center"
                    sx={{
                      color: setting === "Logout" ? "error.main" : "inherit",
                      fontWeight: setting === "Logout" ? 600 : 400,
                    }}
                  >
                    {setting}
                  </Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </MuiAppBar>
  );
}
