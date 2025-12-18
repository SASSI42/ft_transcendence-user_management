 import { Link } from 'react-router-dom';
import Logo from '../assets/mobile-logo.svg';
import PingoHappy from '../assets/pingo_happy.svg';
import TimeMatches from '../assets/icons8-time-machine-48(1).png';
import avatar from '../assets/wolf.jpg';
import next from '../assets/icons8-forward-24.png';
import statistics from '../assets/icons8-statistics-50.png';
import addFriend from '../assets/icons8-add-user-male-24.png';
import chat from '../assets/icons8-chat-48.png';
import i1 from '../assets/icons8-battle-24.png';
import i2 from '../assets/icons8-user-secured-48.png';
import i3 from '../assets/icons8-user-clock-48.png';
import { useState } from 'react';





const paths = {
  "sign_in" : ["/signin", "Sign in"],
  "sign_up" : ["/signup", "Sign up"],
  "password_lost" : ["/forgot-password", "Forgot Password"],
  "password_reset" : ["/reset-password", "Reset Password"],
  "update_password" : ["/update_password", "Update_password"],
  "update_email" : ["/update_email", "Update_email"],
  "update_username" : ["/update_username", "Update_username"],
  "not_found_page" : ["/not_found_page", "we are so Sorry!!"],
  "two_factor" : ["/two_factor", "two factor auth"],
}

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

function Leaders({username, score})
{
  return(
    <>     
      <p className='ml-12 font-bebas-neue'><p className='inline-block ml-5 mr-12 text-h4'>{score}</p> 
      <img className='rounded-full border-2 border-gray-500 w-12 h-12 my-4 mr-8 inline-block' src={avatar}/> {username}</p>
      <hr className='ml-8 max-w-[900px] border-gray-500' />
    </>
  )
}

const LeaderBoard = () => {
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

const res = leaders.map((t)=>{return (<Leaders score={t.score} username={t.username1}/>)})
  const [input, setInput] = useState('')
  return (
    <div className="flex flex-col justify-between h-screen">
      <div className="flex flex-row items-center justify-between m-5 lg:m-6 xl:m-6">
        <Link to="/dashboard"><img src={Logo} /></Link>
      </div>
      <div className="flex flex-col self-center h-2/3 w-3/4 min-h-[90px] min-w-[20px] max-w-[1000px] max-h-[1000px] rounded-3xl bg-secondaryGradient 
      border-2 border-t-teal-400 border-l-teal-400 border-b-teal-400 border-r-teal-400">
        <div className='flex justify-between'>
          <p className='ml-8 my-8 font-bebas-neue text-h2 text-gray-300'><img className='inline-block h-[30px] w-[30px] mr-3' src={statistics}/>leaderboard</p>
          <div className='mr-8 my-9'>
          <input
          value={input}
          onChange={(event)=>{setInput(event.target.value)}}
          placeholder= '   search for players'
          type='search'
          className='text-black h-[30px] w-[220px] rounded-md border-black'></input>
          <input type='submit' value='submit' disabled={false} onClick={()=>{
            console.log(input)
          }} className='ml-5 border-blue-500 border-2  primary-button text-bgsecondary border-transparent rounded-md w-[70px] h-[30px]' />
          </div>
        </div>
        <div className='ml-5 flex'>
        <p className='ml-12'>rank</p>
        <p className='mr-4 ml-8'>avatar</p>
        <p className='ml-4'>name</p>
        </div>
        <hr className='ml-8 my-2 w-[900px] border-gray-500'/>
        {res}
        <div className='border-black'>
          <p className='text-h4 font-bebas-neue'><img className='inline-block rounded-3xl w-12 h-12' src={avatar}/>hello world</p>
        </div>
      </div>
      <div className='h-12'></div>
    </div>
  )
}

export default LeaderBoard
