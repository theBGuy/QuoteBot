export async function fetchRandomRiddle() {
  try {
    const response = await fetch("https://riddles-api.vercel.app/random");
    const data = await response.json();
    return { riddle: data.riddle, answer: data.answer };
  } catch (error) {
    console.error("Error fetching riddle", error);
    return null;
  }
}
