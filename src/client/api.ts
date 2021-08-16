const callStack: number[] = [];

function registerCall() {
  callStack.push(+Date.now());

  const spinner = document.getElementById("spinner");
  spinner?.classList.remove("hidden");
}

function unregisterCall() {
  callStack.pop();

  if (callStack.length === 0) {
    setTimeout(() => {
      const spinner = document.getElementById("spinner");
      spinner?.classList.add("hidden");
    }, 1000);
  }
}

/** Custom api client  */
export async function callApi(input: RequestInfo, init?: RequestInit) {
  registerCall();

  return fetch(input, init)
    .then((res) => {
      unregisterCall();

      return res;
    })
    .catch((res) => {
      unregisterCall();
      return res;
    });
}
