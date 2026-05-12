function entitiesToMap(entities) {
  return entities.reduce((acc, entity) => {
    if (!entity || !entity.entity) {
      return acc;
    }

    acc[entity.entity] = entity.value;
    return acc;
  }, {});
}

module.exports = {
  entitiesToMap,
};
