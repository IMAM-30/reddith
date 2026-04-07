// Replicate Laravel paginate response shape supaya frontend tidak perlu diubah
async function paginate(model, { page = 1, perPage = 15, where = {}, include = [], order = [['created_at', 'DESC']], attributes }) {
  page = parseInt(page) || 1;
  perPage = parseInt(perPage) || 15;
  const offset = (page - 1) * perPage;

  const { rows, count } = await model.findAndCountAll({
    where,
    include,
    order,
    limit: perPage,
    offset,
    attributes,
    distinct: true,
  });

  const lastPage = Math.max(1, Math.ceil(count / perPage));

  return {
    current_page: page,
    data: rows,
    from: count === 0 ? null : offset + 1,
    to: count === 0 ? null : offset + rows.length,
    last_page: lastPage,
    per_page: perPage,
    total: count,
  };
}

// Wrap data array biasa jadi format paginate-like (untuk endpoint yang query manual)
function wrapPaginate(items, { page = 1, perPage = 15, total = null } = {}) {
  total = total ?? items.length;
  return {
    current_page: page,
    data: items,
    from: items.length ? (page - 1) * perPage + 1 : null,
    to: items.length ? (page - 1) * perPage + items.length : null,
    last_page: Math.max(1, Math.ceil(total / perPage)),
    per_page: perPage,
    total,
  };
}

module.exports = { paginate, wrapPaginate };
