const log = (...args) => console.log(...args)

function makeRequest(i) {
  return new Promise(res => {
    setTimeout(_ => res(i * 10), 1000 * Math.random())
  })
}

function makeList(n) {
  return "0".repeat(n)
    .split("")
    .map((_, i) => _ => makeRequest(i))
}


const list = makeList(15)
log(list)

//function max(list) {
  //let max = -1000
  //for (const el of list) {
    //if (el > max) {
      //max = el
    //}
  //}

  //return max
//}


class Evt {
  constructor() {
    this.handlers = []
  }

  emit(...args) {
    this.handlers.forEach(hdlr => hdlr(...args))
  }

  on(cb) {
    this.handlers.push(cb)
  }
}

// TODO
// - progress event
function proc(list, batch_size = 5) {
  const batch = []
  let next_index
  const res = []
  let ready_count = 0;

  const initial_batch = list.slice(0, batch_size)
    .map((f, index) => {
      batch.push(index)
      next_index = index + 1
      return f()
    })

  log(batch)
  log(next_index)

  const evt = new Evt()
  const ret_prom = new Promise(resolve => {
    function updateState(ret, op_index) {
      res[op_index] = ret
      ready_count += 1

      if (ready_count === list.length) {
        return resolve(res)
      }

      const batch_index = batch.indexOf(op_index)
      const next_op_index = next_index

      evt.emit(ret, op_index, batch, next_op_index)
      if (next_op_index >= list.length) {
        return
      }
      batch[batch_index] = next_op_index
      log("BATCH INDEX", batch_index)
      log("RESULT", res)
      log("\n\n")
      list[next_op_index]().then(ret => updateState(ret, next_op_index))
      next_index += 1
    }

    initial_batch
      .map((p, op_index) => { p.then(ret => updateState(ret, op_index)) })
  })

  ret_prom.evt = evt
  return ret_prom
}


const res = proc(list)

res.evt.on((ret, op_index, batch, next_op_index) => {
  log("OP INDEX", op_index, ret)
  log("NEXT_INDEX", next_op_index)
  log("BATCH", batch)
})

res.then(log)
