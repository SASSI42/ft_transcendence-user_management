import { useState, useEffect } from 'react';
import PingoHappy from '../assets/pingo_happy.svg';
import useForm from './useFormInput';
import PasswordField from './PasswordField';
import { validatePassword, validateToken } from '../utils/FormValidation';
import Input from './input';
import RecoverPasswordApi from '../api/recoverPassword';
import { useApiSubmission } from '../hooks/useApiSubmission';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useToast } from './toastContext';
import Cookies from "js-cookie";


function PasswordReset() {
	const password = useForm('', validatePassword);
  const [passError, setpassError] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tokenError, setTokenError] = useState('');
  const navigate = useNavigate();
  const { showToast } = useToast() as any;
	const { isLoading, isSuccess, submissionError, submit } = useApiSubmission();

  
  const checkpasswords = (e:any) => {
    if (e.target.value == password.value)
      setpassError('');
    else
      setpassError('Must match the new password above');
  }

  // const { token } = useParams();
  // useEffect(() => {
  //       const error = validateToken(token);
  //       console.log(token, error);
        
  //       if (error) {
  //           setTokenError(error);
  //           // Optional: Redirect user to /forgot-password if token is missing
  //       }
  //   }, [token]);
  
	const handleSubmit = async (e:any) => {
		e.preventDefault();

		const passworderror = validatePassword(password.value)
    const confirmPasswordErr = validatePassword(password.oldValue);

		password.setError(passworderror);
    password.setError1(confirmPasswordErr);

		if (passworderror || confirmPasswordErr) {
			return ;
		}
		const apiCall = () => RecoverPasswordApi(password.value, password.oldValue);

		try {
      const response = await submit(apiCall);
			showToast(`${response.message}`, response.success ? 'success' : 'failure');
			response.success && navigate('/signin');
		} catch (error) {
			console.error("Submission failed, error shown to user.");
		}
	};

  return (
    <>
      <img className="w-12" src={PingoHappy}></img>
      <div className="m-3">
        <p className="font-bebas-neue text-h4">Complete Your Password Update</p>
        <p className="text-h5body">This will immediately replace your old password and grant you access to your account.</p>
      </div>
      {submissionError && (<span className={isSuccess ? 'submission-success' : 'submission-error'}> {submissionError} </span>)}
      {tokenError && (<span className="submission-error"> {tokenError} </span>)}
      <form className="flex flex-col gap-2 w-4/5" onSubmit={handleSubmit}>
        <div className={`flex flex-col gap-0 rounded-lg ${password.error ? "bg-red/15" : ""}`}>
				  <PasswordField
				  	onChange={password.onChange}
				  	onBlur={password.onBlur}
				  	value={password.value}
				  	error={password.error}
          />
          {password.error && <span className='error-span' > {password.error}</span>}
        </div>
        <div className={`flex flex-col gap-0 rounded-lg ${passError ? "bg-red/15" : ""}`}>
				  <PasswordField
				  	onChange={password.onChange1}
				  	onBlur={password.onBlur1}
				  	value={password.oldValue}
				  	error={password.error1}
          />
          {password.error1 && <span className='error-span' >{password.error1}</span>}
        </div>
		    <Input
		    type="submit"
		    name="submit"
		    value="update password"
        error={password.error != passError}
        isLoading={isLoading}
		    />
		    <div className="flex flex-row items-center justify-evenly">
		    	<hr className="w-1/3 border-bgsecondary" />
		    	<p className="text-h6body">or</p>
		    	<hr className="w-1/3 border-bgsecondary" />
		    </div>
        <div className="flex flex-row flex-wrap mb-5 justify-evenly font-bebas-neue">
          <Link to="/signin" className="w-full secondary-button">
          sign in
          </Link>
        </div>
      </form>
    </>
  )
}

export default PasswordReset
