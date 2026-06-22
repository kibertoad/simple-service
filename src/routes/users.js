const express = require("express");

/**
 * Build the users router.
 *
 * @param {Object} deps
 * @param {ReturnType<import("../service/userService").createUserService>} deps.userService
 * @returns {import("express").Router}
 */
function createUsersRouter({ userService }) {
  const router = express.Router();

  router.post("/", (req, res, next) => {
    try {
      const user = userService.createUser(req.body);
      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  });

  router.put("/:id", (req, res, next) => {
    try {
      const user = userService.replaceUser(req.params.id, req.body);
      res.status(200).json(user);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createUsersRouter };
