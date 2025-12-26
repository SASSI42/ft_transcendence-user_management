import { Link } from 'react-router-dom';
import Logo from '../assets/mobile-logo.svg';
import PingoHappy from '../assets/pingo_happy.svg';
import TimeMatches from '../assets/icons8-time-machine-48(1).png';
import avatar from '../assets/default_avatar.png';
import next from '../assets/icons8-forward-24.png';
import statistics from '../assets/icons8-statistics-50.png';
import addFriend from '../assets/icons8-add-user-male-24.png';
import chat from '../assets/icons8-chat-48.png';
import element1 from '../assets/icons8-battle-24.png';
import element2 from '../assets/icons8-user-secured-48.png';
import element3 from '../assets/icons8-user-clock-48.png';

function Matches ({username1, username2, time, res1, res2, game})
{
  let id = 15;
  return (
    <div>
          <div className='flex'>
          <p className='my-6 ml-11 text-gray-400 text-h6'>{time}</p>
          <p className='font-bebas-neue my-6 mx-6'>{username1}</p>
          <img src={avatar} className='rounded-full border-2 border-gray-500 w-9 h-9 my-4'/>
          <p className='mx-3 my-5 font-bebas-neue text-h4'>{res1} - {res2}</p>
          <img src={avatar} className='rounded-full border-2 border-gray-500 w-9 h-9 my-4'/>
          <p className='font-bebas-neue my-6 mx-5'>{username2}</p>
          <p className='my-6 mx-1 text-gray-400 text-h6'>{game}</p>
        </div>
          <hr className='ml-16 max-w-[470px] border-gray-500'></hr>
    </div>
  )
}

function LeaderBoard({username, score})
{
  return(
    <>     
      <p className='ml-14 font-bebas-neue'><p className='inline-block mx-5'>{score}</p> 
      <img className='rounded-full border-2 border-gray-500 w-9 h-9 my-4 mr-5 inline-block' src={avatar}/> {username}</p>
      <hr className='ml-14 max-w-[470px] border-gray-500' />
    </>
  )
}

const UserProfile = () => {
  let i = 1;
  let id = 15;
  let username1 = "shisui uchiha";
  const elements = [
    {
    username1 :'shisui uchiha',
    username2 :'shisui uchiha',
    time: '3 hours ago',
    res1: '3',
    res2: '2',
    game: 'ping pong'}
    ,     {
    username1 :'hatake kakashe',
    username2 :'shisui uchiha',
    time: '3 days ago',
    res1: '1',
    res2: '5',
    game: 'tic tac toe'},    {
    username1 :'shisui uchiha',
    username2 :'shisui uchiha',
    time: '3 hours ago',
    res1: '3',
    res2: '2',
    game: 'ping pong'},
  {
    username1 :'shisui uchiha',
    username2 :'shisui uchiha',
    time: '1 week ago',
    res1: '6',
    res2: '5',
    game: 'tic tac toe'}]
  const t = elements.map((s)=>{
    return(
    <Matches username1={s.username1} username2={s.username2} time={s.time} res1={s.res1} res2={s.res2} game={s.game}></Matches>
    )
  })

  const leaders = [
    {
    username1: 'hatake kakashe',
    score: 12
  }
  ,     {
    username1: 'obito uchiha',
    score: 13
  },     {
    username1: 'shisui uchiha [you]',
    score: 14
  },
  {
    username1: 'suichi uchiha',
    score: 15
  },
]

const res = leaders.map((t)=>{
  return(
    <LeaderBoard score={t.score} username={t.username1}/>
  )
})

  return (
    <div className="flex flex-col justify-between h-screen">
      <div className="flex flex-row items-center justify-between m-5 lg:m-6 xl:m-6">
        <Link to="/dashboard"><img src={Logo} /></Link>
      </div>
      <div className="flex flex-col self-center h-2/3 w-3/4 min-h-[90px] min-w-[20px] max-w-[1000px] max-h-[1000px] rounded-3xl bg-secondaryGradient 
      border-2 border-t-teal-400 border-l-teal-400 border-b-teal-400 border-r-teal-400">
        <div className='flex-row justify-between my-8 mx-8 border-2 border-gray-500 rounded-3xl bg-secondaryGradient'>
          <div className='flex justify-between'>
          <div className='flex flex-row'>
            <div className='my-8 mx-8 justify-center'>
            <img className="rounded-3xl border-4 border-black h-10/4 min-h-[80px] w-9/4 max-w-[90px]" src={avatar}></img>
            </div>
            <p className='flex self-center font-bebas-neue text-h4'>{username1} #{id}</p>
          </div>
            <p className='
            bg-secondaryGradient
            text-white
            font-semibold
            text-sm
            inline-flex
            items-center
            px-3 py-2
            shadow-md
            mx-6 my-6 border-2 border-gray-500 h-[30px] w-[90px] max-w-[90px] rounded-full font-bebas-neue text-h4'>
            <span className={i ? "h-3 w-3 bg-emerald-400 rounded-full mr-2" : "h-3 w-3 bg-black rounded-full mr-2"}></span> 
            online
        </p>
          </div>
          <hr className='mb-2 border-gray-600'></hr>

          <div className='flex'>
                <div className='flex ml-1 bg-secondaryGradient rounded-3xl'>
                <div className='ml-3 mb-2 flex-row items-center border-2 border-gray-600 w-[90px] h-[90px] rounded-3xl text-cyan-500 bg-secondaryGradient'>
                    <p className='py-2 flex justify-center font-bebas-neue text-h4'>{100}</p>
                    <p className='flex justify-center text-h6'>Maches played</p>
                </div>
                <div className='ml-3 mb-2 flex-row items-center border-2 border-gray-600 w-[90px] h-[90px] rounded-3xl  bg-secondaryGradient text-emerald-400'>
                    <p className='py-2 flex justify-center font-bebas-neue text-h4'>{80}</p>
                    <p className='flex justify-center text-h6'>Maches won</p>
                </div>
                <div className='ml-3 mb-2 flex-row items-center border-2 border-gray-600 w-[90px] h-[90px] rounded-3xl bg-secondaryGradient text-rose-500'>
                    <p className='py-2 flex justify-center font-bebas-neue text-h4 '>{20}</p>
                    <p className='flex justify-center  text-h6'>Maches lost</p>
                </div>
                <div className='ml-3 mb-2 flex-row items-center border-2 border-gray-600 w-[90px] h-[90px] rounded-3xl bg-secondaryGradient text-yellow-300'>
                    <p className='py-2 flex justify-center font-bebas-neue text-h4 '>{80}</p>
                    <p className='flex justify-center  text-h6'>Maches Rate</p>
                </div>
                <div className='ml-3 mb-2 flex-row items-center border-2 border-gray-600 w-[90px] h-[90px] rounded-3xl bg-black text-cyan-500 bg-secondaryGradient'>
                    <p className='py-2 flex justify-center font-bebas-neue text-h4 '>{10}</p>
                    <p className='flex justify-center text-h6'>tournaments</p>
                    <p className='flex justify-center text-h6'>played</p>
                </div>
                <div className='ml-3 mb-2 flex-row items-center border-2 border-gray-600 w-[90px] h-[90px] rounded-3xl bg-secondaryGradient text-emerald-400'>
                    <p className='py-2 flex justify-center font-bebas-neue text-h4 '>02</p>
                    <p className='  flex justify-center text-h6'>tournaments</p>
                    <p className='  flex justify-center  text-h6'>won</p>
                </div>

                                                                                                                            
                </div>
                <div className='ml-4 flex'>
                <hr className='w-px h-20 border-2 rounded-3xl border-gray-600 mr-5 my-2'/>
                </div>
          </div>
        </div>
        <div className='flex'>
        <div>
        <div className='flex justify-between '>
          <p className='ml-8 font-bebas-neue'><img className='inline-block h-6' src={TimeMatches}/> recent matches</p>
          <Link to="/Recent_maches" className='text-gray-400 hover:text-cyan-400'>see more <img className="inline-block" src={next}/></Link>
        </div>
        {t}
        </div>
        <div className='flex flex-col'>        
        <div className='flex justify-between mb-2'>
          <p className='ml-8 font-bebas-neue'><img className='inline-block w-4 mr-2' src={statistics}/> leaderboard</p>
          <Link to="/leaderboard" className=' ml-16 text-gray-400 hover:text-cyan-400'>see more <img className="inline-block" src={next}/></Link>
        </div>
        {res}
        </div>
        </div>      
      </div>
      <div className='h-12'></div>
    </div>
  )
}

export default UserProfile
