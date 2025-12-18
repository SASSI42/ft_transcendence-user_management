import Input from './input'
import { FiLock } from 'react-icons/fi'

const PasswordField = ({
	className = '',
	placeHolder = 'Password',
	value,
	onChange,
	onBlur,
	error
}) => {
	return (<Input
		className={className}
		icon={<FiLock size={18} />}
		type="password"
		name="password"
		placeholder={placeHolder}
		value={value}
		onChange={onChange}
		onBlur={onBlur}
		error={error}
		/>)
}

export default PasswordField;