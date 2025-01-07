import {User} from "buzzy-schemas"
import mongoose from 'mongoose';
import cloudinary from "./cloudconfig.js";





export const getUserProfile = async (req, res) => {
    try {
        // console.log(req.userId)
        const {userId} = req.params
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        console.log(user)
        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({ error: error });
    }
};

export const getuser = async (req, res) => {
    try {
        console.log('here it is')
        console.log("user id ",req.userId)
        console.log(req.userId)
        // const {username} = req.params
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        console.log(user)
        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({ error: error });
    }
};





const searchUsers = async (searchTerm) => {
    try {
        // Ensure the searchTerm is trimmed and in lowercase for case-insensitive search
        const term = searchTerm.trim().toLowerCase();

        // Find users where the username starts with the searchTerm
        const users = await User.find({
            username: { $regex: `^${term}`, $options: 'i' } // Case-insensitive search
        });
        console.log(users)
        return users;
    } catch (error) {
        console.error('Error searching users:', error);
        throw error;
    }
};

export const search = async(req, res) => {
    const { term } = req.query;
    console.log(term);
    if (!term) {
        return res.status(400).json({ message: 'Search term is required' });
    }

    try {
        const users = await searchUsers(term);
        res.status(201).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error searching for users' });
    }
}


export const followUser = async (req, res) => {
    try {
        const { usernameToFollow } = req.body;  // The username of the user to follow
        const currentUsername = req.body.currentUsername; // The username of the current user

        // Find and update the current user by username
        const user = await User.findOneAndUpdate(
            {_id:currentUsername},
            { $addToSet: { following: usernameToFollow } },  // Add the target username to the `following` list
            { new: true }  // Return the updated document
        );

        if (!user) {
            return res.status(404).json({ message: 'Current user not found' });
        }

        // Optionally, update the followed user to add the current user's username to their followers
        const followedUser = await User.findOneAndUpdate(
            {_id:usernameToFollow},  // Query by the target username
            { $addToSet: { followers: currentUsername } },  // Add the current username to the `followers` list
            { new: true }  // Return the updated document
        );

        if (!followedUser) {
            return res.status(404).json({ message: 'User to follow not found' });
        }

        return res.status(200).json({ user, followedUser });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error });
    }
};


// Unfollow a user
export const unfollowUser = async (req, res) => {
    try {
        const { currentUsername, usernameToFollow } = req.body;
        console.log(currentUsername, usernameToFollow);

        // Ensure the ids are valid ObjectIds, since they're in string form
        const currentUserId = new mongoose.Types.ObjectId(currentUsername);
        const userToUnfollowId = new mongoose.Types.ObjectId(usernameToFollow);

        // Fetch the users by their ObjectId
        const currentUser = await User.findOne({ _id: currentUserId });
        const userToUnfollow = await User.findOne({ _id: userToUnfollowId });

        if (!currentUser || !userToUnfollow) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if currentUser is following the userToUnfollow
        if (!currentUser.following.includes(userToUnfollowId)) {
            return res.status(400).json({ message: 'You are not following this user' });
        }

        // Use $pull to remove the user from both the following and followers arrays
        await User.updateOne(
            { _id: currentUserId },
            { $pull: { following: userToUnfollowId } }
        );

        await User.updateOne(
            { _id: userToUnfollowId },
            { $pull: { followers: currentUserId } }
        );

        res.status(200).json({ message: 'User unfollowed successfully' });
    } catch (error) {
        console.error('Error while unfollowing user:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


export const EditProfile = async (req, res) => {
    try {
      const { username, bio } = req.body;
      const file = req.file;
  
     
  
      // Find the user to get the current profile picture's public_id
      const existingUser = await User.findById(req.userId);
  
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // If the user has an existing profile picture, delete it from Cloudinary
      if(file){
        if (existingUser.profilePic) {
            const publicId = existingUser.profilePic.split('/').pop().split('.')[0]; // Extract public_id
            await cloudinary.uploader.destroy(publicId, (error, result) => {
              if (error) {
                console.error('Error deleting previous image:', error);
              } else {
                console.log('Previous image deleted:', result);
              }
            });
          }
      }
  
      // Upload the new profile picture to Cloudinary
      if(file){
        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              { resource_type: 'image' },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            ).end(file.buffer);
          });

          const user = await User.findByIdAndUpdate(
            req.userId,
            { username, bio, profilePic: result.secure_url },
            { new: true }
          );
      }

      const user = await User.findByIdAndUpdate(
        req.userId,
        { username, bio,},
        { new: true }
      );
  
      // Update the user's profile with new data
      
  
      return res.status(200).json({
        message: "Profile updated successfully!",
        user,
      });
    } catch (error) {
      console.error('Error while editing profile:', error.message);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };
  