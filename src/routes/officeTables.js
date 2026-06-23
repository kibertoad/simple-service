const express = require("express");

/**
 * Build the office tables router.
 *
 * @param {Object} deps
 * @param {ReturnType<import("../service/officeTableService").createOfficeTableService>} deps.officeTableService
 * @returns {import("express").Router}
 */
function createOfficeTablesRouter({ officeTableService }) {
  const router = express.Router();

  router.post("/", (req, res, next) => {
    try {
      const table = officeTableService.createOfficeTable(req.body);
      res.status(201).json(table);
    } catch (err) {
      next(err);
    }
  });

  router.get("/", (req, res, next) => {
    try {
      const { items, nextCursor } = officeTableService.listOfficeTables({
        cursor: req.query.cursor,
        limit: req.query.limit,
      });

      if (nextCursor) {
        res.setHeader("X-Next-Cursor", nextCursor);
      }

      res.status(200).json(items);
    } catch (err) {
      next(err);
    }
  });

  router.get("/:id", (req, res, next) => {
    try {
      const table = officeTableService.getOfficeTable(req.params.id);
      res.status(200).json(table);
    } catch (err) {
      next(err);
    }
  });

  router.put("/:id", (req, res, next) => {
    try {
      const table = officeTableService.replaceOfficeTable(req.params.id, req.body);
      res.status(200).json(table);
    } catch (err) {
      next(err);
    }
  });

  router.delete("/:id", (req, res, next) => {
    try {
      officeTableService.deleteOfficeTable(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createOfficeTablesRouter };
