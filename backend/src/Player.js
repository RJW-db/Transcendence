class	PlayerClass{
	constructor(socket, id){
		this.socket = socket;
		this.id = id;
		this.role = null;
		this.matchId = null;

	}
	sendMessage(type, payload){
		if (this.socket.readyState === 1) {
            const message = JSON.stringify({ type, payload });
            this.socket.send(message);
        }
	}
	assignRole(role) {
        this.role = role;
        // Notify the player of their new role!
        this.sendMessage('roleAssigned', { role: this.role });
    }
}
export default PlayerClass
//module.exports = Player;