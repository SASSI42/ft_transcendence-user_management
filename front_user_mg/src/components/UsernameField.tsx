import Input from './input'
import { FiUser } from 'react-icons/fi'

const UsernameField = ({
	className = '',
	value,
	onChange,
	onBlur,
	error,
	placeHolder = 'username'
}) => {

	return (<Input
		className={className}
		icon={<FiUser size={18} />}
		name="username"
		placeholder={placeHolder}
		value={value}
		onChange={onChange}
		onBlur={onBlur}
		error={error}
		/>)
}

export default UsernameField;