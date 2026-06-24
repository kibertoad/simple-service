const express = require("express");

/**
 * Build the bears router.
 *
 * @param {Object} deps
 * @param {ReturnType<import("../service/bearService").createBearService>} deps.bearService
 * @returns {import("express").Router}
 */
function createBearsRouter({ bearService }) {
  const router = express.Router();

  router.post("/", (req, res, next) => {
    try {
      const bear = bearService.createBear(req.body);
      res.status(201).json(bear);
    } catch (err) {
      next(err);
    }
  });

  router.get("/", (req, res, next) => {
    try {
      const { cursor, limit } = req.query;
      const result = bearService.listBears({ cursor, limit });
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  });

  router.get("/:id", (req, res, next) => {
    try {
      const bear = bearService.getBear(req.params.id);
      res.status(200).json(bear);
    } catch (err) {
      next(err);
    }
  });

  router.put("/:id", (req, res, next) => {
    try {
      const bear = bearService.updateBear(req.params.id, req.body);
      res.status(200).json(bear);
    } catch (err) {
      next(err);
    }
  });

  router.delete("/:id", (req, res, next) => {
    try {
      bearService.deleteBear(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createBearsRouter };
