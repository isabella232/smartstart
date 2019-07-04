'use strict';

module.exports = (state) => {
  return new Promise((resolve) => {
    state.tx.commit();
    return resolve(state);
  });
};
