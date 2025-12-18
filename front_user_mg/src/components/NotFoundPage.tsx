import PingoSad from '../assets/pingo_sad.png';

function NotFoundPage() {
  return (
    <>
      <img className="w-11 " src={PingoSad}></img>
      <div className="mb-6">
        <p className="font-bebas-neue text-h4">Code : 404</p>
        <p className="text-h1body font-bebas-neue">the page doesn't exist !</p>
      </div>
    </>
  )
}

export default NotFoundPage
