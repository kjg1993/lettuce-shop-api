require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("./config/passport");
const swaggerUi = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");
const schemas = require("./docs/swaggerSchemas");

// Route imports
const itemRoutes = require("./routes/itemRoutes");
const listRoutes = require("./routes/listRoutes");
const storeRoutes = require("./routes/storeRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();
app.set("trust proxy", 1);

// Middleware
app.use(cors());
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
  }),
);
app.use(passport.initialize());
app.use(passport.session());

// MongoDB connection
if (process.env.NODE_ENV != "test") {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log("MongoDB connected to your personal cluster"))
    .catch((err) => console.error("MongoDB connection error:", err));
}

// Swagger setup
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Lettuce Shop API",
      version: "1.0.0",
      description: "API docs for Lettuce Shop",
    },
    components: {
      schemas: schemas,
    },
  },
  apis: ["./routes/*.js"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

const fs = require('fs');
fs.writeFileSync('./docs/swagger.json', JSON.stringify(swaggerDocs, null, 2));
console.log('swagger.json generated!');

// Basic route
app.get("/", (req, res) => {
  res.send("Lettuce Shop API is running with Google Auth");
});

// ============================
// ACTUALIZACIÓN: OAuth Routes (Google en lugar de GitHub)
// ============================

app.get("/auth/google", (req, res, next) => {
    console.log("Intentando autenticar con Google...");
    passport.authenticate("google", { 
        scope: ["profile", "email"] 
    })(req, res, next);
});

app.get("/auth/google/callback",
    passport.authenticate("google", { 
        failureRedirect: "/",
        session: true 
    }),
    (req, res) => {
        console.log("Login exitoso para:", req.user.displayName);
        res.redirect("/api-docs");
    }
);

app.get("/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => { res.redirect("/api-docs"); }
);

app.get("/profile", (req, res) => {
  res.json(req.user || "Not logged in");
});

app.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/");
  });
});

// Collection routes
app.use("/items", itemRoutes);
app.use("/lists", listRoutes);
app.use("/stores", storeRoutes);
app.use("/users", userRoutes);

// Start server
if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;