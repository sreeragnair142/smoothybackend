const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middleware/auth");
const upload = require("../middleware/upload");
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

router.route("/").get(getProducts);
router
  .route("/")
  .post(protect, admin, upload.array("images", 5), createProduct);

router
  .route("/:id")
  .get(getProductById)
  .put(protect, admin, upload.array("images", 5), updateProduct)
  .delete(protect, admin, deleteProduct);

module.exports = router;