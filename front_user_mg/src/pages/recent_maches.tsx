 import { Link } from 'react-router-dom';
import Logo from '../assets/mobile-logo.svg';
import PingoHappy from '../assets/wolf.jpg';
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

function Tournament(){

  return (
      <div className='my-4 ml-12 border-2 border-gray-500 w-[370px] rounded-3xl flex-end'>
        <div className='flex justify-between'>
        <div>
          <p className='font-bebas-neue text-h4 ml-4 h-6'>1337 tournament</p>
          <p className='ml-5 '>Ping pong . bo5</p>
        </div>
        <div className='mr-2'>
          <p className='font-bebas-neue text-h4 ml-4'>WIN</p>
          <p>{'3 hours ago'}</p>
        </div>
        </div>
        <hr className='ml-4 mr-2 border-gray-500'/>
        <p className='my-3 ml-4 w-[400px]'><img className='inline-block mr-4 rounded-3xl w-[40px] h-[40px]' src={PingoHappy}/>{"hshshshs"}
        <p className='inline-block ml-2 font-bebas-neue text-h4'>01<p className='inline-block mr-2'>
          </p></p>| {'02'} | {'03'} | {'05'} | {'06'}  | {'07'}</p>
        <hr className='mx-16'/>
        <p className='my-3 ml-4 w-[400px]'><img className='inline-block mr-4 rounded-3xl w-[40px] h-[40px]' src={PingoHappy}/>{"hshshshs"}
        <p className='inline-block ml-2 font-bebas-neue text-h4'>01<p className='inline-block mr-2'>
          </p></p>| {'02'} | {'03'} | {'05'} | {'06'}  | {'07'}</p>
      </div>
  )
}

const Recent_maches = () => {
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
    username1: 'shisui uchiha',
    score: 14
  },
  {
    username1: 'suichi uchiha',
    score: 15
  },
]

const res = leaders.map((t)=>{return (<Leaders score={t.score} username={t.username1}/>)})
  return (                                                                                                                                                        
    <div className="flex flex-col justify-between h-screen">
      <div className="flex flex-row items-center justify-between m-5 lg:m-6 xl:m-6">
        <Link to="/dashboard"><img src={Logo} /></Link>
      </div>
      <div className="flex flex-col self-center h-2/3 w-3/4 min-h-[90px] min-w-[20px] max-w-[1000px] max-h-[1000px] rounded-3xl bg-secondaryGradient 
      border-2 border-t-teal-400 border-l-teal-400 border-b-teal-400 border-r-teal-400">
        <div className='flex justify-between'>
          <p className='ml-8 my-8 font-bebas-neue text-h2 text-gray-300'><img className='inline-block h-[40px] w-[40px] mr-3' src={TimeMatches}/>recent maches</p>
        </div>
        <div className='ml-16 flex iteams-end'>
        <img src={i1}/>
        <p className='ml-4 border-2 rounded-3xl w-[100px] h-[30px] bg-white text-black'><img className='inline-block ml-1 mr-1' src={i1}/>1v1 only</p>
        <p className='ml-4 border-2 rounded-3xl w-[160px] h-[30px] bg-white text-black'><img className='inline-block ml-1 mr-1' src={i1}/>tournament only</p>
        <p className='ml-4 border-2 rounded-3xl w-[100px] h-[30px] bg-white text-black'>ping pong</p>
        <p className='ml-4 border-2 rounded-3xl w-[100px] h-[30px] bg-white text-black'>tic tac toe</p>
        <p className='ml-4 border-2 rounded-3xl w-[100px] h-[25px] bg-white text-black'>best of 3</p>
        <p className='ml-4 border-2 rounded-3xl w-[100px] h-[25px] bg-white text-black self-center'>best of 5</p>
        </div>
        <div className='flex'>
        <div>
        <Tournament/>
        <Tournament/>
        <Tournament/>
        </div>
        <div>
        <Tournament/>
        <Tournament/>
        <Tournament/>
        </div>
        </div>

      </div>
      <div className='h-12'></div>
    </div>
  )
}

export default Recent_maches
