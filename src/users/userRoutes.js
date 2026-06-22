"use strict";

const express = require("express");
const { UserService } = require("./UserService");

const userService = new UserService();

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

function parseListQuery(query) {
  return {
    limit: query.limit,
    offset: query.offset,
    q: query.q,
    role: query.role,
    sort: query.sort,
  };
}

const router = express.Router();

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const user = await userService.createUser(req.body);
    res.status(201).json(user);
  })
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const result = await userService.listUsers(parseListQuery(req.query));
    res.status(200).json(result);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const user = await userService.getUser(req.params.id);
    res.status(200).json(user);
  })
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const user = await userService.updateUser(req.params.id, req.body);
    res.status(200).json(user);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await userService.deleteUser(req.params.id);
    res.status(204).send();
  })
);

module.exports = router;
